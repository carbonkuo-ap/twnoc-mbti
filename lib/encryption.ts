import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'fallback-key-for-development';

export interface EncryptedData {
  data: string;
  timestamp: number;
}

/**
 * 加密資料
 */
export function encryptData(data: any): string {
  try {
    const jsonString = JSON.stringify(data);
    const encryptedData: EncryptedData = {
      data: CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString(),
      timestamp: Date.now()
    };
    return btoa(JSON.stringify(encryptedData));
  } catch (error) {
    console.error('加密失敗:', error);
    throw new Error('資料加密失敗');
  }
}

/**
 * 解密資料
 */
export function decryptData<T = any>(encryptedString: string): T {
  try {
    const encryptedData: EncryptedData = JSON.parse(atob(encryptedString));
    const bytes = CryptoJS.AES.decrypt(encryptedData.data, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedString) {
      throw new Error('解密失敗：無效的密鑰或資料');
    }

    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('解密失敗:', error);
    throw new Error('資料解密失敗');
  }
}

/**
 * 驗證加密資料的完整性
 */
export function validateEncryptedData(encryptedString: string): boolean {
  try {
    const encryptedData: EncryptedData = JSON.parse(atob(encryptedString));
    return typeof encryptedData.data === 'string' && typeof encryptedData.timestamp === 'number';
  } catch {
    return false;
  }
}

/**
 * 獲取加密資料的時間戳
 */
export function getEncryptedDataTimestamp(encryptedString: string): number {
  try {
    const encryptedData: EncryptedData = JSON.parse(atob(encryptedString));
    return encryptedData.timestamp;
  } catch {
    return 0;
  }
}