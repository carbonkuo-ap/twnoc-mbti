import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { encryptData, decryptData } from './encryption';

const TOTP_SECRET_KEY = 'mbti_totp_secret';
const TOTP_SETUP_KEY = 'mbti_totp_setup';

export interface TOTPSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  isEnabled: boolean;
}

/**
 * 生成 TOTP 秘鑰和設定
 */
export async function generateTOTPSetup(): Promise<TOTPSetup> {
  // 生成隨機秘鑰
  const secret = new OTPAuth.Secret({ size: 32 });

  // 創建 TOTP 實例
  const totp = new OTPAuth.TOTP({
    issuer: 'MBTI 測驗',
    label: 'MBTI Admin',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret
  });

  // 生成 QR Code URL
  const qrCodeUrl = await QRCode.toDataURL(totp.toString());

  // 生成備用恢復碼
  const backupCodes = generateBackupCodes();

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes,
    isEnabled: false
  };
}

/**
 * 儲存 TOTP 設定
 */
export function saveTOTPSetup(setup: TOTPSetup): void {
  try {
    const encryptedSetup = encryptData(setup);
    localStorage.setItem(TOTP_SETUP_KEY, encryptedSetup);
  } catch (error) {
    console.error('儲存 TOTP 設定失敗:', error);
    throw new Error('無法儲存 TOTP 設定');
  }
}

/**
 * 載入 TOTP 設定
 */
export function loadTOTPSetup(): TOTPSetup | null {
  try {
    const encryptedSetup = localStorage.getItem(TOTP_SETUP_KEY);
    if (!encryptedSetup) return null;

    return decryptData<TOTPSetup>(encryptedSetup);
  } catch (error) {
    console.error('載入 TOTP 設定失敗:', error);
    return null;
  }
}

/**
 * 驗證 TOTP 代碼
 */
export function verifyTOTPCode(code: string, secret: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    });

    // 驗證當前代碼（允許前後30秒的時間偏差）
    const delta = totp.validate({
      token: code,
      window: 1
    });

    return delta !== null;
  } catch (error) {
    console.error('TOTP 驗證失敗:', error);
    return false;
  }
}

/**
 * 啟用 TOTP
 */
export function enableTOTP(verificationCode: string): boolean {
  const setup = loadTOTPSetup();
  if (!setup) return false;

  if (verifyTOTPCode(verificationCode, setup.secret)) {
    setup.isEnabled = true;
    saveTOTPSetup(setup);
    return true;
  }

  return false;
}

/**
 * 停用 TOTP
 */
export function disableTOTP(): void {
  localStorage.removeItem(TOTP_SETUP_KEY);
}

/**
 * 檢查是否已啟用 TOTP
 */
export function isTOTPEnabled(): boolean {
  const setup = loadTOTPSetup();
  return setup?.isEnabled === true;
}

/**
 * 驗證備用恢復碼
 */
export function verifyBackupCode(code: string): boolean {
  const setup = loadTOTPSetup();
  if (!setup || !setup.backupCodes) return false;

  const codeIndex = setup.backupCodes.indexOf(code);
  if (codeIndex !== -1) {
    // 使用後移除備用碼
    setup.backupCodes.splice(codeIndex, 1);
    saveTOTPSetup(setup);
    return true;
  }

  return false;
}

/**
 * 生成備用恢復碼
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // 生成 8 位數字備用碼
    const code = Math.random().toString().slice(2, 10);
    codes.push(code);
  }
  return codes;
}

/**
 * 取得剩餘備用碼數量
 */
export function getRemainingBackupCodes(): number {
  const setup = loadTOTPSetup();
  return setup?.backupCodes?.length || 0;
}

/**
 * 重新生成備用碼
 */
export function regenerateBackupCodes(): string[] {
  const setup = loadTOTPSetup();
  if (!setup) throw new Error('TOTP 未設定');

  const newBackupCodes = generateBackupCodes();
  setup.backupCodes = newBackupCodes;
  saveTOTPSetup(setup);

  return newBackupCodes;
}