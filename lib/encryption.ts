import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'fallback-key-for-development';

export interface EncryptedData {
  data: string;
  iv: string;
  authTag: string;
  timestamp: number;
}

/**
 * 生成密鑰派生
 */
function deriveKey(password: string, salt: string): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 10000,
    hasher: CryptoJS.algo.SHA256
  });
}

/**
 * 使用 AES-256-CTR + HMAC 加密資料（等同於 GCM 的安全性）
 */
export function encryptData(data: any): string {
  try {
    const jsonString = JSON.stringify(data);

    // 生成隨機 IV 和 Salt
    const iv = CryptoJS.lib.WordArray.random(128 / 8); // 128-bit IV for CTR
    const salt = CryptoJS.lib.WordArray.random(128 / 8);

    // 派生加密密鑰和 HMAC 密鑰
    const encKey = deriveKey(ENCRYPTION_KEY + ':enc', salt.toString());
    const hmacKey = deriveKey(ENCRYPTION_KEY + ':mac', salt.toString());

    // 使用 AES-256-CTR 加密
    const encrypted = CryptoJS.AES.encrypt(jsonString, encKey, {
      iv: iv,
      mode: CryptoJS.mode.CTR,
      padding: CryptoJS.pad.NoPadding
    });

    const ciphertext = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

    // 計算 HMAC 驗證標籤（包含 IV 和密文）
    const authData = iv.toString(CryptoJS.enc.Base64) + ciphertext;
    const authTag = CryptoJS.HmacSHA256(authData, hmacKey).toString(CryptoJS.enc.Base64);

    const encryptedData: EncryptedData = {
      data: ciphertext,
      iv: iv.toString(CryptoJS.enc.Base64),
      authTag: authTag,
      timestamp: Date.now()
    };

    // 加入 salt 到最終輸出
    const finalData = {
      ...encryptedData,
      salt: salt.toString(CryptoJS.enc.Base64)
    };

    return btoa(JSON.stringify(finalData));
  } catch (error) {
    console.error('AES-CTR+HMAC 加密失敗:', error);
    throw new Error('資料加密失敗');
  }
}

/**
 * 使用 AES-256-CTR + HMAC 解密資料
 */
export function decryptData<T = any>(encryptedString: string): T {
  try {
    const encryptedData = JSON.parse(atob(encryptedString));
    const { data, iv, authTag, salt } = encryptedData;

    // 重建密鑰
    const encKey = deriveKey(ENCRYPTION_KEY + ':enc', salt);
    const hmacKey = deriveKey(ENCRYPTION_KEY + ':mac', salt);

    // 驗證 HMAC（防止篡改）
    const authData = iv + data;
    const computedAuthTag = CryptoJS.HmacSHA256(authData, hmacKey).toString(CryptoJS.enc.Base64);

    if (computedAuthTag !== authTag) {
      throw new Error('認證失敗：資料可能已被篡改');
    }

    // 解密
    const decrypted = CryptoJS.AES.decrypt(data, encKey, {
      iv: CryptoJS.enc.Base64.parse(iv),
      mode: CryptoJS.mode.CTR,
      padding: CryptoJS.pad.NoPadding
    });

    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedString) {
      throw new Error('解密失敗：無效的密鑰或資料');
    }

    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('AES-CTR+HMAC 解密失敗:', error);
    throw new Error('資料解密失敗');
  }
}

/**
 * 驗證加密資料的完整性
 */
export function validateEncryptedData(encryptedString: string): boolean {
  try {
    const encryptedData = JSON.parse(atob(encryptedString));
    return (
      typeof encryptedData.data === 'string' &&
      typeof encryptedData.iv === 'string' &&
      typeof encryptedData.authTag === 'string' &&
      typeof encryptedData.salt === 'string' &&
      typeof encryptedData.timestamp === 'number'
    );
  } catch {
    return false;
  }
}

/**
 * 獲取加密資料的時間戳
 */
export function getEncryptedDataTimestamp(encryptedString: string): number {
  try {
    const encryptedData = JSON.parse(atob(encryptedString));
    return encryptedData.timestamp || 0;
  } catch {
    return 0;
  }
}

/**
 * 檢查是否為舊格式的加密資料
 */
function isLegacyFormat(encryptedData: any): boolean {
  return (
    typeof encryptedData.data === 'string' &&
    typeof encryptedData.timestamp === 'number' &&
    !encryptedData.iv &&
    !encryptedData.authTag &&
    !encryptedData.salt
  );
}

/**
 * 解密舊格式資料（向後相容）
 */
function decryptLegacyData<T = any>(encryptedData: any): T {
  const bytes = CryptoJS.AES.decrypt(encryptedData.data, ENCRYPTION_KEY);
  const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

  if (!decryptedString) {
    throw new Error('舊格式解密失敗：無效的密鑰或資料');
  }

  return JSON.parse(decryptedString);
}

/**
 * 通用解密函數（支援新舊格式）
 */
export function decryptDataWithFallback<T = any>(encryptedString: string): T {
  try {
    const encryptedData = JSON.parse(atob(encryptedString));

    // 檢查是否為舊格式
    if (isLegacyFormat(encryptedData)) {
      console.warn('檢測到舊格式加密資料，建議重新加密');
      return decryptLegacyData<T>(encryptedData);
    }

    // 使用新格式解密
    const { data, iv, authTag, salt } = encryptedData;

    const encKey = deriveKey(ENCRYPTION_KEY + ':enc', salt);
    const hmacKey = deriveKey(ENCRYPTION_KEY + ':mac', salt);

    const authData = iv + data;
    const computedAuthTag = CryptoJS.HmacSHA256(authData, hmacKey).toString(CryptoJS.enc.Base64);

    if (computedAuthTag !== authTag) {
      throw new Error('認證失敗：資料可能已被篡改');
    }

    const decrypted = CryptoJS.AES.decrypt(data, encKey, {
      iv: CryptoJS.enc.Base64.parse(iv),
      mode: CryptoJS.mode.CTR,
      padding: CryptoJS.pad.NoPadding
    });

    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

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
 * 檢查加密資料是否過期
 */
export function isEncryptedDataExpired(encryptedString: string, expirationMs: number = 24 * 60 * 60 * 1000): boolean {
  try {
    const timestamp = getEncryptedDataTimestamp(encryptedString);
    return timestamp > 0 && (Date.now() - timestamp) > expirationMs;
  } catch {
    return true;
  }
}

/**
 * 安全地清除記憶體中的敏感資料
 */
export function secureWipe(obj: any): void {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          obj[key] = '';
        } else if (typeof obj[key] === 'object') {
          secureWipe(obj[key]);
        }
      }
    }
  }
}