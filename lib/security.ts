import CryptoJS from 'crypto-js';

/**
 * 生成隨機鹽值
 */
export function generateSalt(length: number = 32): string {
  return CryptoJS.lib.WordArray.random(length).toString();
}

/**
 * 使用 PBKDF2 進行密碼雜湊
 */
export function hashPassword(password: string, salt: string, iterations: number = 10000): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: iterations,
    hasher: CryptoJS.algo.SHA256
  }).toString();
}

/**
 * 驗證密碼
 */
export function verifyPassword(password: string, hash: string, salt: string, iterations: number = 10000): boolean {
  const computedHash = hashPassword(password, salt, iterations);
  return computedHash === hash;
}

/**
 * 生成瀏覽器指紋
 */
export async function generateFingerprint(): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('MBTI Security Fingerprint', 2, 2);
  }

  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: canvas.toDataURL(),
    webgl: getWebGLFingerprint(),
  };

  const fingerprintString = JSON.stringify(fingerprint);
  return CryptoJS.SHA256(fingerprintString).toString();
}

/**
 * 取得 WebGL 指紋
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter((debugInfo as any).UNMASKED_VENDOR_WEBGL) : '';
    const renderer = debugInfo ? gl.getParameter((debugInfo as any).UNMASKED_RENDERER_WEBGL) : '';

    return `${vendor}~${renderer}`;
  } catch {
    return 'webgl-error';
  }
}

/**
 * 生成隨機字串
 */
export function generateRandomString(length: number = 16): string {
  return CryptoJS.lib.WordArray.random(length).toString();
}

/**
 * 安全的隨機數生成
 */
export function secureRandom(min: number, max: number): number {
  const range = max - min;
  const randomBytes = CryptoJS.lib.WordArray.random(4);
  const randomValue = randomBytes.words[0] >>> 0; // 轉為無符號 32 位整數
  return min + (randomValue % range);
}

/**
 * 檢查密碼強度
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 20;
  else feedback.push('密碼長度至少需要 8 位');

  if (/[a-z]/.test(password)) score += 20;
  else feedback.push('需要包含小寫字母');

  if (/[A-Z]/.test(password)) score += 20;
  else feedback.push('需要包含大寫字母');

  if (/[0-9]/.test(password)) score += 20;
  else feedback.push('需要包含數字');

  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  else feedback.push('需要包含特殊字符');

  return { score, feedback };
}

/**
 * 防時間攻擊的字串比較
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * 生成 CSRF Token
 */
export function generateCSRFToken(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

/**
 * 驗證 CSRF Token
 */
export function verifyCSRFToken(token: string, storedToken: string): boolean {
  return constantTimeCompare(token, storedToken);
}