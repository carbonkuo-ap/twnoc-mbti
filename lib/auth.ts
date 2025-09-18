import { encryptData, decryptData } from './encryption';

export interface AdminUser {
  username: string;
  isAuthenticated: boolean;
  loginTime: number;
}

const SESSION_KEY = 'mbti_admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * 驗證管理員憑證
 */
export function validateAdminCredentials(username: string, password: string): boolean {
  const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'twnoc-yjmbti';
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'default-password';

  return username === adminUsername && password === adminPassword;
}

/**
 * 創建管理員會話
 */
export function createAdminSession(username: string): void {
  const sessionData: AdminUser = {
    username,
    isAuthenticated: true,
    loginTime: Date.now()
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
 * 獲取當前管理員會話
 */
export function getAdminSession(): AdminUser | null {
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
export function isAuthenticated(): boolean {
  const session = getAdminSession();
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
export function refreshAdminSession(): void {
  const session = getAdminSession();
  if (session) {
    session.loginTime = Date.now();
    createAdminSession(session.username);
  }
}

/**
 * 獲取會話剩餘時間（毫秒）
 */
export function getSessionTimeRemaining(): number {
  const session = getAdminSession();
  if (!session) return 0;

  const elapsed = Date.now() - session.loginTime;
  const remaining = SESSION_DURATION - elapsed;
  return Math.max(0, remaining);
}

/**
 * 檢查是否即將過期（30分鐘內）
 */
export function isSessionExpiringSoon(): boolean {
  const remaining = getSessionTimeRemaining();
  const thirtyMinutes = 30 * 60 * 1000;
  return remaining > 0 && remaining < thirtyMinutes;
}