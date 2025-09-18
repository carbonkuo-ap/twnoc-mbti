import { encryptData, decryptData } from './encryption';
import { generateCSRFToken } from './security';
import { logAuditEvent, AuditEventType } from './audit';

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
export function saveOTPToken(token: OTPToken): void {
  try {
    const tokens = getAllOTPTokens();
    tokens.push(token);
    
    const encrypted = encryptData(tokens);
    localStorage.setItem(OTP_STORAGE_KEY, encrypted);
    
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
 * 獲取所有 OTP Tokens
 */
export function getAllOTPTokens(): OTPToken[] {
  try {
    const encrypted = localStorage.getItem(OTP_STORAGE_KEY);
    if (!encrypted) return [];
    
    const tokens = decryptData<OTPToken[]>(encrypted);
    // 過濾掉已過期的 tokens
    return tokens.filter(token => token.expiresAt > Date.now());
  } catch (error) {
    console.error('載入 OTP Tokens 失敗:', error);
    return [];
  }
}

/**
 * 驗證 OTP Token
 */
export function validateOTPToken(tokenString: string): { valid: boolean; token?: OTPToken; error?: string } {
  try {
    const tokens = getAllOTPTokens();
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
export function useOTPToken(tokenString: string, testResultId?: number): boolean {
  try {
    const validation = validateOTPToken(tokenString);
    if (!validation.valid || !validation.token) {
      return false;
    }
    
    const tokens = getAllOTPTokens();
    const tokenIndex = tokens.findIndex(t => t.token === tokenString);
    
    if (tokenIndex !== -1) {
      tokens[tokenIndex].usedAt = Date.now();
      if (testResultId) {
        tokens[tokenIndex].testResultId = testResultId;
      }
      
      const encrypted = encryptData(tokens);
      localStorage.setItem(OTP_STORAGE_KEY, encrypted);
      
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
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('使用 OTP Token 失敗:', error);
    return false;
  }
}

/**
 * 刪除 OTP Token
 */
export function deleteOTPToken(tokenString: string): boolean {
  try {
    const tokens = getAllOTPTokens();
    const filteredTokens = tokens.filter(t => t.token !== tokenString);
    
    if (tokens.length === filteredTokens.length) {
      return false; // Token 不存在
    }
    
    const encrypted = encryptData(filteredTokens);
    localStorage.setItem(OTP_STORAGE_KEY, encrypted);
    
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
    const tokens = getAllOTPTokens();
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