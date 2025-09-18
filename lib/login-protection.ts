interface LoginAttempt {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const LOGIN_ATTEMPTS_KEY = 'mbti_login_attempts';
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 分鐘
const ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 小時內重設計數器

/**
 * 記錄登入失敗
 */
export function recordLoginFailure(): void {
  const attempts = getLoginAttempts();
  const now = Date.now();

  // 如果超過 1 小時，重設計數器
  if (now - attempts.lastAttempt > ATTEMPT_WINDOW) {
    attempts.count = 1;
  } else {
    attempts.count += 1;
  }

  attempts.lastAttempt = now;

  // 如果達到最大嘗試次數，設定封鎖時間
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.blockedUntil = now + BLOCK_DURATION;
  }

  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
}

/**
 * 記錄登入成功（清除失敗記錄）
 */
export function recordLoginSuccess(): void {
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
}

/**
 * 檢查是否被封鎖
 */
export function isLoginBlocked(): { blocked: boolean; remainingTime?: number } {
  const attempts = getLoginAttempts();
  const now = Date.now();

  if (attempts.blockedUntil && now < attempts.blockedUntil) {
    return {
      blocked: true,
      remainingTime: attempts.blockedUntil - now
    };
  }

  // 如果封鎖時間已過，清除封鎖狀態
  if (attempts.blockedUntil && now >= attempts.blockedUntil) {
    attempts.blockedUntil = undefined;
    attempts.count = 0;
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  }

  return { blocked: false };
}

/**
 * 獲取當前登入嘗試次數
 */
export function getLoginAttempts(): LoginAttempt {
  try {
    const stored = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('讀取登入嘗試記錄失敗:', error);
  }

  return {
    count: 0,
    lastAttempt: 0
  };
}

/**
 * 檢查是否需要顯示驗證碼
 */
export function shouldShowCaptcha(): boolean {
  const attempts = getLoginAttempts();
  return attempts.count >= 3; // 3 次失敗後顯示驗證碼
}

/**
 * 取得登入延遲時間（指數退避）
 */
export function getLoginDelay(): number {
  const attempts = getLoginAttempts();
  if (attempts.count <= 2) return 0;

  // 指數退避：2^(嘗試次數-2) 秒，最大 30 秒
  const delay = Math.min(Math.pow(2, attempts.count - 2) * 1000, 30000);
  return delay;
}

/**
 * 格式化剩餘時間
 */
export function formatRemainingTime(ms: number): string {
  const minutes = Math.floor(ms / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  if (minutes > 0) {
    return `${minutes} 分 ${seconds} 秒`;
  }
  return `${seconds} 秒`;
}

/**
 * 檢查 IP 相關的指紋（模擬 IP 封鎖）
 */
export function checkFingerprint(): string {
  // 使用瀏覽器指紋作為 IP 的替代
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset()
  ].join('|');

  return btoa(fingerprint);
}

/**
 * 重設登入保護（管理員功能）
 */
export function resetLoginProtection(): void {
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
}