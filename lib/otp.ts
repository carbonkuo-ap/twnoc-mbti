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
 * 儲存 OTP Token (Firebase only)
 */
export async function saveOTPToken(token: OTPToken): Promise<void> {
  try {
    // 只保存到 Firebase
    const success = await saveOTPTokenToFirebase(token);

    if (!success) {
      throw new Error('Firebase 保存失敗');
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
 * 獲取本地 OTP Tokens（已廢棄，保留向後兼容）
 */
function getLocalOTPTokens(): OTPToken[] {
  console.warn('getLocalOTPTokens is deprecated. Use getAllOTPTokens instead.');
  return [];
}

/**
 * 獲取所有本地 OTP Tokens（已廢棄，保留向後兼容）
 */
export function getAllLocalOTPTokens(): OTPToken[] {
  console.warn('getAllLocalOTPTokens is deprecated. Use getAllOTPTokens instead.');
  return [];
}

/**
 * 獲取所有 OTP Tokens（Firebase only）
 */
export async function getAllOTPTokens(includeExpired: boolean = false): Promise<OTPToken[]> {
  try {
    // 只從 Firebase 獲取 tokens
    const firebaseTokens = await getAllOTPTokensFromFirebase(includeExpired);

    // 按創建時間排序
    return firebaseTokens.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('載入 Firebase OTP Tokens 失敗:', error);
    return [];
  }
}

/**
 * 同步版本的獲取所有 OTP Tokens（已廢棄）
 */
export function getAllOTPTokensSync(): OTPToken[] {
  console.warn('getAllOTPTokensSync is deprecated. Use getAllOTPTokens instead.');
  return [];
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
 * 驗證 OTP Token（同步版本，已廢棄）
 */
export function validateOTPToken(tokenString: string): { valid: boolean; token?: OTPToken; error?: string } {
  console.warn('validateOTPToken (sync) is deprecated. Use validateOTPTokenAsync instead.');
  return { valid: false, error: '請使用異步版本的驗證函數' };
}

/**
 * 使用 OTP Token (Firebase only)
 */
export async function useOTPToken(tokenString: string, testResultId?: number): Promise<boolean> {
  try {
    // 使用異步驗證，檢查最新狀態
    const validation = await validateOTPTokenAsync(tokenString);
    if (!validation.valid || !validation.token) {
      console.log('OTP Token 驗證失敗:', validation.error);
      return false;
    }

    // 只更新 Firebase
    try {
      await updateOTPTokenUsageInFirebase(tokenString, testResultId);
      console.log('Firebase OTP Token 使用狀態更新成功');
    } catch (firebaseError) {
      console.error('Firebase 更新 OTP Token 失敗:', firebaseError);
      return false;
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
 * 刪除 OTP Token (Firebase only)
 */
export async function deleteOTPToken(tokenString: string): Promise<boolean> {
  try {
    // 只從 Firebase 刪除
    const success = await deleteOTPTokenFromFirebase(tokenString);

    if (!success) {
      return false;
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
 * 清理過期的 OTP Tokens（已廢棄）
 */
export function cleanupExpiredOTPTokens(): number {
  console.warn('cleanupExpiredOTPTokens is deprecated. Expired tokens are handled by Firebase queries.');
  return 0;
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
 * 獲取 OTP Token 統計 (Firebase only)
 */
export async function getOTPStatistics(): Promise<{
  total: number;
  active: number;
  used: number;
  expired: number;
}> {
  try {
    const allTokens = await getAllOTPTokens(true); // 包含已過期的
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
 * 批次生成 OTP Tokens (Firebase only)
 */
export async function generateBatchOTPTokens(count: number, config?: Partial<OTPConfig>): Promise<OTPToken[]> {
  const tokens: OTPToken[] = [];

  for (let i = 0; i < count; i++) {
    const token = generateOTPToken(config);
    tokens.push(token);
    try {
      await saveOTPToken(token);
    } catch (error) {
      console.error(`保存第 ${i + 1} 個 OTP Token 失敗:`, error);
    }
  }

  return tokens;
}