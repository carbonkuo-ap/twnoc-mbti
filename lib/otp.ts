import { encryptData, decryptData } from './encryption';
import { generateCSRFToken } from './security';
import { logAuditEvent, AuditEventType } from './audit';
import {
  saveOTPTokenToFirebase,
  getAllOTPTokensFromFirebase,
  deleteOTPTokenFromFirebase,
  updateOTPTokenUsageInFirebase
} from './firebase';

export interface OTPToken {
  token: string;
  createdAt: number;
  expiresAt: number;
  usedAt?: number;
  testResultId?: number;
  metadata?: {
    description?: string;
    createdBy?: string;
    allowMultipleUse?: boolean;
  };
}

export interface OTPConfig {
  expirationDays: number;
  allowMultipleUse: boolean;
  maxUsageCount?: number;
  usageCount?: number;
}

const OTP_STORAGE_KEY = 'mbti_otp_tokens';
const DEFAULT_EXPIRATION_DAYS = 7;

/**
 * 生成 OTP Token
 */
export function generateOTPToken(config?: Partial<OTPConfig>): OTPToken {
  const token = generateCSRFToken(); // 使用現有的 token 生成函數
  const now = Date.now();
  const expirationDays = config?.expirationDays || DEFAULT_EXPIRATION_DAYS;
  
  const otpToken: OTPToken = {
    token,
    createdAt: now,
    expiresAt: now + (expirationDays * 24 * 60 * 60 * 1000),
    metadata: {
      description: config?.expirationDays ? `有效期 ${config.expirationDays} 天` : '標準有效期',
      createdBy: 'admin'
    }
  };

  return otpToken;
}

/**
 * 儲存 OTP Token
 */
export async function saveOTPToken(token: OTPToken): Promise<void> {
  try {
    // 保存到本地
    const tokens = getLocalOTPTokens();
    tokens.push(token);

    const encrypted = encryptData(tokens);
    localStorage.setItem(OTP_STORAGE_KEY, encrypted);

    // 嘗試保存到 Firebase
    try {
      await saveOTPTokenToFirebase(token);
    } catch (firebaseError) {
      console.warn('Firebase 保存 OTP Token 失敗，但本地保存成功:', firebaseError);
    }

    // 記錄審計日誌
    logAuditEvent(
      AuditEventType.ADMIN,
      'create_otp',
      { token: token.token.substring(0, 8) + '...', expiresAt: token.expiresAt }
    );
  } catch (error) {
    console.error('儲存 OTP Token 失敗:', error);
    throw new Error('無法儲存 OTP Token');
  }
}

/**
 * 獲取本地 OTP Tokens（只返回未過期的）
 */
function getLocalOTPTokens(): OTPToken[] {
  try {
    const encrypted = localStorage.getItem(OTP_STORAGE_KEY);
    if (!encrypted) return [];

    const tokens = decryptData<OTPToken[]>(encrypted);
    // 過濾掉已過期的 tokens
    return tokens.filter(token => token.expiresAt > Date.now());
  } catch (error) {
    console.error('載入本地 OTP Tokens 失敗:', error);
    return [];
  }
}

/**
 * 獲取所有本地 OTP Tokens（包含已過期的）
 */
export function getAllLocalOTPTokens(): OTPToken[] {
  try {
    const encrypted = localStorage.getItem(OTP_STORAGE_KEY);
    if (!encrypted) return [];

    const tokens = decryptData<OTPToken[]>(encrypted);
    // 返回所有 tokens，包括已過期的
    return tokens;
  } catch (error) {
    console.error('載入本地 OTP Tokens 失敗:', error);
    return [];
  }
}

/**
 * 獲取所有 OTP Tokens（本地 + Firebase），正確合併使用狀態
 */
export async function getAllOTPTokens(includeExpired: boolean = false): Promise<OTPToken[]> {
  try {
    // 獲取本地 tokens
    const localTokens = includeExpired ? getAllLocalOTPTokens() : getLocalOTPTokens();

    // 嘗試獲取 Firebase tokens
    let firebaseTokens: OTPToken[] = [];
    try {
      firebaseTokens = await getAllOTPTokensFromFirebase(includeExpired);
    } catch (error) {
      console.warn('獲取 Firebase OTP Tokens 失敗:', error);
    }

    // 合併並正確處理使用狀態（Firebase 優先）
    const tokenMap = new Map<string, OTPToken>();

    // 先添加本地 tokens
    localTokens.forEach(localToken => {
      tokenMap.set(localToken.token, localToken);
    });

    // 再添加 Firebase tokens，如果同一個 token 在 Firebase 中有更新的使用狀態，則使用 Firebase 的
    firebaseTokens.forEach(firebaseToken => {
      const existingToken = tokenMap.get(firebaseToken.token);
      if (existingToken) {
        // 如果 Firebase 中有使用記錄而本地沒有，或者 Firebase 的使用時間更新，則使用 Firebase 的狀態
        if ((firebaseToken.usedAt && !existingToken.usedAt) ||
            (firebaseToken.usedAt && existingToken.usedAt && firebaseToken.usedAt > existingToken.usedAt)) {
          tokenMap.set(firebaseToken.token, {
            ...existingToken,
            usedAt: firebaseToken.usedAt,
            testResultId: firebaseToken.testResultId
          });
        }
      } else {
        // 新的 token，直接添加
        tokenMap.set(firebaseToken.token, firebaseToken);
      }
    });

    // 轉換為陣列並按創建時間排序
    const allTokens = Array.from(tokenMap.values());
    return allTokens.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('載入 OTP Tokens 失敗:', error);
    return getLocalOTPTokens(); // fallback 到本地 tokens
  }
}

/**
 * 同步版本的獲取所有 OTP Tokens（向後兼容）
 */
export function getAllOTPTokensSync(): OTPToken[] {
  return getLocalOTPTokens();
}

/**
 * 驗證 OTP Token（異步版本，檢查本地和 Firebase）
 */
export async function validateOTPTokenAsync(tokenString: string): Promise<{ valid: boolean; token?: OTPToken; error?: string }> {
  try {
    const tokens = await getAllOTPTokens();
    const token = tokens.find(t => t.token === tokenString);

    if (!token) {
      return { valid: false, error: '無效的 OTP Token' };
    }

    // 檢查是否過期
    if (token.expiresAt < Date.now()) {
      return { valid: false, error: 'OTP Token 已過期' };
    }

    // 檢查是否已使用（如果是單次使用）
    if (token.usedAt && !token.metadata?.allowMultipleUse) {
      return { valid: false, error: 'OTP Token 已使用' };
    }

    return { valid: true, token };
  } catch (error) {
    console.error('驗證 OTP Token 失敗:', error);
    return { valid: false, error: '驗證過程發生錯誤' };
  }
}

/**
 * 驗證 OTP Token（同步版本，僅檢查本地）
 */
export function validateOTPToken(tokenString: string): { valid: boolean; token?: OTPToken; error?: string } {
  try {
    const tokens = getAllOTPTokensSync();
    const token = tokens.find(t => t.token === tokenString);

    if (!token) {
      return { valid: false, error: '無效的 OTP Token' };
    }

    // 檢查是否過期
    if (token.expiresAt < Date.now()) {
      return { valid: false, error: 'OTP Token 已過期' };
    }

    // 檢查是否已使用（如果是單次使用）
    if (token.usedAt && !token.metadata?.allowMultipleUse) {
      return { valid: false, error: 'OTP Token 已使用' };
    }

    return { valid: true, token };
  } catch (error) {
    console.error('驗證 OTP Token 失敗:', error);
    return { valid: false, error: '驗證過程發生錯誤' };
  }
}

/**
 * 使用 OTP Token
 */
export async function useOTPToken(tokenString: string, testResultId?: number): Promise<boolean> {
  try {
    // 使用異步驗證，檢查最新狀態
    const validation = await validateOTPTokenAsync(tokenString);
    if (!validation.valid || !validation.token) {
      console.log('OTP Token 驗證失敗:', validation.error);
      return false;
    }

    // 更新本地
    const tokens = getLocalOTPTokens();
    const tokenIndex = tokens.findIndex(t => t.token === tokenString);

    if (tokenIndex !== -1) {
      tokens[tokenIndex].usedAt = Date.now();
      if (testResultId) {
        tokens[tokenIndex].testResultId = testResultId;
      }

      const encrypted = encryptData(tokens);
      localStorage.setItem(OTP_STORAGE_KEY, encrypted);
    }

    // 嘗試更新 Firebase
    try {
      await updateOTPTokenUsageInFirebase(tokenString, testResultId);
      console.log('Firebase OTP Token 使用狀態更新成功');
    } catch (firebaseError) {
      console.warn('Firebase 更新 OTP Token 失敗，但本地更新成功:', firebaseError);
    }

    // 記錄審計日誌
    logAuditEvent(
      AuditEventType.AUTH,
      'use_otp',
      {
        token: tokenString.substring(0, 8) + '...',
        testResultId,
        success: true
      }
    );

    console.log('OTP Token 使用成功:', tokenString.substring(0, 8) + '...');
    return true;
  } catch (error) {
    console.error('使用 OTP Token 失敗:', error);
    return false;
  }
}

/**
 * 刪除 OTP Token
 */
export async function deleteOTPToken(tokenString: string): Promise<boolean> {
  try {
    // 刪除本地
    const tokens = getLocalOTPTokens();
    const filteredTokens = tokens.filter(t => t.token !== tokenString);
    
    if (tokens.length === filteredTokens.length) {
      return false; // Token 不存在
    }
    
    const encrypted = encryptData(filteredTokens);
    localStorage.setItem(OTP_STORAGE_KEY, encrypted);

    // 嘗試從 Firebase 刪除
    try {
      await deleteOTPTokenFromFirebase(tokenString);
    } catch (firebaseError) {
      console.warn('Firebase 刪除 OTP Token 失敗，但本地刪除成功:', firebaseError);
    }

    // 記錄審計日誌
    logAuditEvent(
      AuditEventType.ADMIN,
      'delete_otp',
      { token: tokenString.substring(0, 8) + '...' }
    );

    return true;
  } catch (error) {
    console.error('刪除 OTP Token 失敗:', error);
    return false;
  }
}

/**
 * 清理過期的 OTP Tokens
 */
export function cleanupExpiredOTPTokens(): number {
  try {
    const tokens = getLocalOTPTokens();
    const activeTokens = tokens.filter(token => token.expiresAt > Date.now());
    const cleanedCount = tokens.length - activeTokens.length;
    
    if (cleanedCount > 0) {
      const encrypted = encryptData(activeTokens);
      localStorage.setItem(OTP_STORAGE_KEY, encrypted);
      
      logAuditEvent(
        AuditEventType.SYSTEM,
        'cleanup_otp',
        { cleanedCount }
      );
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('清理過期 OTP Tokens 失敗:', error);
    return 0;
  }
}

/**
 * 生成可分享的 OTP URL
 */
export function generateShareableOTPUrl(token: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${baseUrl}${basePath}/?otp=${encodeURIComponent(token)}`;
}

/**
 * 從 URL 提取 OTP Token
 */
export function extractOTPFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('otp');
}

/**
 * 獲取 OTP Token 統計
 */
export function getOTPStatistics(): {
  total: number;
  active: number;
  used: number;
  expired: number;
} {
  try {
    const encrypted = localStorage.getItem(OTP_STORAGE_KEY);
    if (!encrypted) {
      return { total: 0, active: 0, used: 0, expired: 0 };
    }
    
    const allTokens = decryptData<OTPToken[]>(encrypted);
    const now = Date.now();
    
    return {
      total: allTokens.length,
      active: allTokens.filter(t => t.expiresAt > now && !t.usedAt).length,
      used: allTokens.filter(t => t.usedAt).length,
      expired: allTokens.filter(t => t.expiresAt <= now).length
    };
  } catch (error) {
    console.error('獲取 OTP 統計失敗:', error);
    return { total: 0, active: 0, used: 0, expired: 0 };
  }
}

/**
 * 批次生成 OTP Tokens
 */
export function generateBatchOTPTokens(count: number, config?: Partial<OTPConfig>): OTPToken[] {
  const tokens: OTPToken[] = [];
  
  for (let i = 0; i < count; i++) {
    const token = generateOTPToken(config);
    tokens.push(token);
    saveOTPToken(token);
  }
  
  return tokens;
}