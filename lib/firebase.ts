import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, get, onValue, off, query, orderByChild, limitToLast, DataSnapshot, update, remove } from 'firebase/database';
import { TestResult } from './personality-test';
import { OTPToken } from './otp';

// Firebase 配置
// 請在 Firebase Console 中創建專案並獲取配置資訊
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
};

// 初始化 Firebase
let app: any;
let database: any;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
} catch (error) {
  console.error('Firebase 初始化失敗:', error);
}

// 測試結果相關介面
export interface FirebaseTestResult extends TestResult {
  id?: string;
  otpToken?: string;
  deviceInfo?: {
    userAgent: string;
    screenSize: string;
    timezone: string;
  };
  ipHash?: string;
  completedAt: number;
}

// 儲存測試結果到 Firebase
export async function saveTestResultToFirebase(testResult: TestResult, otpToken?: string): Promise<boolean> {
  try {
    if (!database) {
      console.error('Firebase 未初始化');
      return false;
    }

    const deviceInfo = {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      screenSize: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    const firebaseResult: FirebaseTestResult = {
      ...testResult,
      otpToken: otpToken || '',
      deviceInfo,
      completedAt: Date.now()
    };

    // 儲存到 Firebase
    const testResultsRef = ref(database, 'testResults');
    const newResultRef = push(testResultsRef);
    await set(newResultRef, firebaseResult);

    // 如果有 OTP Token，更新使用記錄
    if (otpToken) {
      await updateOTPUsageInFirebase(otpToken, newResultRef.key!);
    }

    console.log('測試結果已儲存到 Firebase:', newResultRef.key);
    return true;
  } catch (error) {
    console.error('儲存測試結果到 Firebase 失敗:', error);
    return false;
  }
}

// 從 Firebase 獲取所有測試結果
export async function getAllTestResultsFromFirebase(): Promise<FirebaseTestResult[]> {
  try {
    if (!database) {
      console.error('Firebase 未初始化');
      return [];
    }

    const testResultsRef = ref(database, 'testResults');
    const snapshot = await get(testResultsRef);

    if (snapshot.exists()) {
      const results: FirebaseTestResult[] = [];
      snapshot.forEach((childSnapshot: DataSnapshot) => {
        const result = childSnapshot.val();
        results.push({
          ...result,
          id: childSnapshot.key
        });
      });

      // 按時間排序（最新的在前）
      results.sort((a, b) => (b.completedAt || b.timestamp) - (a.completedAt || a.timestamp));
      return results;
    }

    return [];
  } catch (error) {
    console.error('從 Firebase 獲取測試結果失敗:', error);
    return [];
  }
}

// 獲取最近的測試結果（即時更新）
export function subscribeToTestResults(callback: (results: FirebaseTestResult[]) => void): () => void {
  if (!database) {
    console.error('Firebase 未初始化');
    return () => {};
  }

  const testResultsRef = ref(database, 'testResults');
  const recentQuery = query(testResultsRef, orderByChild('completedAt'), limitToLast(100));

  const listener = onValue(recentQuery, (snapshot) => {
    const results: FirebaseTestResult[] = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot: DataSnapshot) => {
        const result = childSnapshot.val();
        results.push({
          ...result,
          id: childSnapshot.key
        });
      });

      // 按時間排序（最新的在前）
      results.sort((a, b) => (b.completedAt || b.timestamp) - (a.completedAt || a.timestamp));
    }

    callback(results);
  });

  // 返回取消訂閱的函數
  return () => {
    off(recentQuery, 'value', listener);
  };
}

// OTP Token 使用記錄
export interface OTPUsageRecord {
  token: string;
  testResultId: string;
  usedAt: number;
  deviceInfo?: any;
}

// 更新 OTP 使用記錄
export async function updateOTPUsageInFirebase(token: string, testResultId: string): Promise<boolean> {
  try {
    if (!database) {
      console.error('Firebase 未初始化');
      return false;
    }

    const usageRecord: OTPUsageRecord = {
      token,
      testResultId,
      usedAt: Date.now(),
      deviceInfo: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        screenSize: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    // 儲存使用記錄
    const otpUsageRef = ref(database, `otpUsage/${token}`);
    const newUsageRef = push(otpUsageRef);
    await set(newUsageRef, usageRecord);

    console.log('OTP 使用記錄已更新:', token);
    return true;
  } catch (error) {
    console.error('更新 OTP 使用記錄失敗:', error);
    return false;
  }
}

// 獲取 OTP 的使用記錄
export async function getOTPUsageFromFirebase(token: string): Promise<OTPUsageRecord[]> {
  try {
    if (!database) {
      console.error('Firebase 未初始化');
      return [];
    }

    const otpUsageRef = ref(database, `otpUsage/${token}`);
    const snapshot = await get(otpUsageRef);

    if (snapshot.exists()) {
      const records: OTPUsageRecord[] = [];
      snapshot.forEach((childSnapshot: DataSnapshot) => {
        records.push(childSnapshot.val());
      });
      return records;
    }

    return [];
  } catch (error) {
    console.error('獲取 OTP 使用記錄失敗:', error);
    return [];
  }
}

// 獲取所有 OTP 使用統計
export async function getAllOTPUsageStats(): Promise<{ [token: string]: number }> {
  try {
    if (!database) {
      console.error('Firebase 未初始化');
      return {};
    }

    const otpUsageRef = ref(database, 'otpUsage');
    const snapshot = await get(otpUsageRef);

    const stats: { [token: string]: number } = {};

    if (snapshot.exists()) {
      snapshot.forEach((tokenSnapshot: DataSnapshot) => {
        const token = tokenSnapshot.key!;
        let count = 0;
        tokenSnapshot.forEach(() => {
          count++;
        });
        stats[token] = count;
      });
    }

    return stats;
  } catch (error) {
    console.error('獲取 OTP 使用統計失敗:', error);
    return {};
  }
}

// 檢查 Firebase 是否已連接
export function isFirebaseConnected(): boolean {
  return !!database;
}

// 測試 Firebase 連接
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    if (!database) {
      console.error('Firebase 未初始化');
      return false;
    }

    const testRef = ref(database, '.info/connected');
    const snapshot = await get(testRef);
    return snapshot.val() === true;
  } catch (error) {
    console.error('測試 Firebase 連接失敗:', error);
    return false;
  }
}

// 儲存 OTP Token 到 Firebase
export async function saveOTPTokenToFirebase(token: OTPToken): Promise<boolean> {
  try {
    if (!database) {
      console.error('Firebase 未初始化');
      return false;
    }

    const otpRef = ref(database, `otpTokens/${token.token}`);
    await set(otpRef, {
      ...token,
      syncedAt: Date.now()
    });

    console.log('OTP Token 已保存到 Firebase:', token.token.substring(0, 8) + '...');
    return true;
  } catch (error) {
    console.error('保存 OTP Token 到 Firebase 失敗:', error);
    return false;
  }
}

// 從 Firebase 獲取所有 OTP Tokens
export async function getAllOTPTokensFromFirebase(includeExpired: boolean = false): Promise<OTPToken[]> {
  try {
    if (!database) {
      console.error('Firebase 未初始化');
      return [];
    }

    const otpRef = ref(database, 'otpTokens');
    const snapshot = await get(otpRef);

    if (snapshot.exists()) {
      const tokens: OTPToken[] = [];
      snapshot.forEach((childSnapshot) => {
        const tokenData = childSnapshot.val();
        // 移除 syncedAt 屬性，只保留 OTPToken 屬性
        const { syncedAt, ...otpToken } = tokenData;
        tokens.push(otpToken);
      });

      // 根據參數決定是否過濾已過期的 tokens
      if (includeExpired) {
        return tokens;
      } else {
        return tokens.filter(token => token.expiresAt > Date.now());
      }
    }

    return [];
  } catch (error) {
    console.error('從 Firebase 獲取 OTP Tokens 失敗:', error);
    return [];
  }
}

// 刪除 Firebase 中的 OTP Token
export async function deleteOTPTokenFromFirebase(tokenString: string): Promise<boolean> {
  try {
    if (!database) {
      console.error('Firebase 未初始化');
      return false;
    }

    const otpRef = ref(database, `otpTokens/${tokenString}`);
    await remove(otpRef);

    console.log('OTP Token 已從 Firebase 刪除:', tokenString.substring(0, 8) + '...');
    return true;
  } catch (error) {
    console.error('從 Firebase 刪除 OTP Token 失敗:', error);
    return false;
  }
}

// 更新 OTP Token 使用狀態到 Firebase
export async function updateOTPTokenUsageInFirebase(tokenString: string, testResultId?: number): Promise<boolean> {
  try {
    if (!database) {
      console.error('Firebase 未初始化');
      return false;
    }

    const otpRef = ref(database, `otpTokens/${tokenString}`);
    await update(otpRef, {
      usedAt: Date.now(),
      testResultId: testResultId
    });

    console.log('OTP Token 使用狀態已更新到 Firebase:', tokenString.substring(0, 8) + '...');
    return true;
  } catch (error) {
    console.error('更新 OTP Token 使用狀態到 Firebase 失敗:', error);
    return false;
  }
}