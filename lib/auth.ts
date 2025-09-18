import { encryptData, decryptDataWithFallback as decryptData } from './encryption';
import { hashPassword, verifyPassword, generateFingerprint, generateCSRFToken } from './security';

export interface AdminUser {
  username: string;
  isAuthenticated: boolean;
  loginTime: number;
  fingerprint?: string;
  csrfToken?: string;
  lastActivity: number;
}

const SESSION_KEY = 'mbti_admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const ADMIN_HASH_KEY = 'mbti_admin_hash';
const ADMIN_SALT_KEY = 'mbti_admin_salt';

/**
 * 驗證管理員憑證（使用密碼雜湊）
 */
export function validateAdminCredentials(username: string, password: string): boolean {
  // 檢查使用者名稱
  const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'twnoc-yjmbti';
  if (username !== adminUsername) {
    return false;
  }

  // 取得環境變數中的雜湊值和鹽值
  const adminHash = process.env.NEXT_PUBLIC_ADMIN_HASH || hashPassword('default-password', 'default-salt');
  const adminSalt = process.env.NEXT_PUBLIC_ADMIN_SALT || 'default-salt';

  // 驗證密碼雜湊
  return verifyPassword(password, adminHash, adminSalt);
}

/**
 * 創建管理員會話（包含指紋和 CSRF Token）
 */
export async function createAdminSession(username: string): Promise<void> {
  const fingerprint = await generateFingerprint();
  const csrfToken = generateCSRFToken();

  const sessionData: AdminUser = {
    username,
    isAuthenticated: true,
    loginTime: Date.now(),
    lastActivity: Date.now(),
    fingerprint,
    csrfToken
  };

  try {
    const encryptedSession = encryptData(sessionData);
    localStorage.setItem(SESSION_KEY, encryptedSession);
  } catch (error) {
    console.error('創建會話失敗:', error);
    throw new Error('無法創建管理員會話');
  }
}

/**
 * 獲取當前管理員會話（包含指紋驗證和不活動檢查）
 */
export async function getAdminSession(): Promise<AdminUser | null> {
  try {
    const encryptedSession = localStorage.getItem(SESSION_KEY);
    if (!encryptedSession) {
      return null;
    }

    const sessionData: AdminUser = decryptData(encryptedSession);

    // 檢查會話是否過期
    if (Date.now() - sessionData.loginTime > SESSION_DURATION) {
      clearAdminSession();
      return null;
    }

    // 檢查不活動超時
    if (Date.now() - sessionData.lastActivity > INACTIVITY_TIMEOUT) {
      clearAdminSession();
      return null;
    }

    // 驗證瀏覽器指紋
    if (sessionData.fingerprint) {
      const currentFingerprint = await generateFingerprint();
      if (currentFingerprint !== sessionData.fingerprint) {
        clearAdminSession();
        return null;
      }
    }

    // 更新最後活動時間
    sessionData.lastActivity = Date.now();
    const encryptedUpdatedSession = encryptData(sessionData);
    localStorage.setItem(SESSION_KEY, encryptedUpdatedSession);

    return sessionData;
  } catch (error) {
    console.error('獲取會話失敗:', error);
    clearAdminSession();
    return null;
  }
}

/**
 * 檢查是否已認證
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return session?.isAuthenticated === true;
}

/**
 * 清除管理員會話
 */
export function clearAdminSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * 登出管理員
 */
export function logoutAdmin(): void {
  clearAdminSession();
}

/**
 * 延長會話時間
 */
export async function refreshAdminSession(): Promise<void> {
  const session = await getAdminSession();
  if (session) {
    session.loginTime = Date.now();
    session.lastActivity = Date.now();
    await createAdminSession(session.username);
  }
}

/**
 * 獲取會話剩餘時間（毫秒）
 */
export async function getSessionTimeRemaining(): Promise<number> {
  const session = await getAdminSession();
  if (!session) return 0;

  const elapsed = Date.now() - session.loginTime;
  const remaining = SESSION_DURATION - elapsed;
  return Math.max(0, remaining);
}

/**
 * 檢查是否即將過期（30分鐘內）
 */
export async function isSessionExpiringSoon(): Promise<boolean> {
  const remaining = await getSessionTimeRemaining();
  const thirtyMinutes = 30 * 60 * 1000;
  return remaining > 0 && remaining < thirtyMinutes;
}