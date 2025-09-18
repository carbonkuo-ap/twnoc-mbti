import { openDB } from 'idb';
import { encryptData, decryptDataWithFallback as decryptData } from './encryption';
import { generateFingerprint } from './security';

export interface AuditEvent {
  id?: number;
  timestamp: number;
  type: AuditEventType;
  action: string;
  details: Record<string, any>;
  userAgent: string;
  fingerprint: string;
  ipHash?: string; // 模擬 IP（用指紋代替）
  sessionId?: string;
  success: boolean;
}

export enum AuditEventType {
  AUTH = 'auth',
  ADMIN = 'admin',
  DATA = 'data',
  SECURITY = 'security',
  SYSTEM = 'system'
}

const DB_NAME = 'MBTI_AUDIT_DB';
const DB_VERSION = 1;
const AUDIT_STORE = 'audit_logs';
const MAX_LOG_ENTRIES = 10000; // 最大日誌條目數

/**
 * 初始化審計資料庫
 */
async function getAuditDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(AUDIT_STORE)) {
        const store = db.createObjectStore(AUDIT_STORE, {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('type', 'type');
        store.createIndex('action', 'action');
        store.createIndex('success', 'success');
      }
    },
  });
}

/**
 * 記錄審計事件
 */
export async function logAuditEvent(
  type: AuditEventType,
  action: string,
  details: Record<string, any> = {},
  success: boolean = true
): Promise<void> {
  try {
    const fingerprint = await generateFingerprint();

    const event: AuditEvent = {
      timestamp: Date.now(),
      type,
      action,
      details: {
        ...details,
        url: typeof window !== 'undefined' ? window.location.pathname : '',
        referrer: typeof window !== 'undefined' ? document.referrer : ''
      },
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      fingerprint,
      success
    };

    // 加密審計事件
    const encryptedEvent = {
      ...event,
      encryptedDetails: encryptData(event.details),
      details: undefined // 移除明文詳情
    };

    const db = await getAuditDB();
    const tx = db.transaction(AUDIT_STORE, 'readwrite');
    await tx.objectStore(AUDIT_STORE).add(encryptedEvent);
    await tx.done;

    // 清理舊日誌
    await cleanupOldLogs();

  } catch (error) {
    console.error('記錄審計事件失敗:', error);
    // 審計失敗不應該影響主要功能
  }
}

/**
 * 獲取審計日誌
 */
export async function getAuditLogs(
  filters: {
    type?: AuditEventType;
    action?: string;
    success?: boolean;
    startTime?: number;
    endTime?: number;
    limit?: number;
  } = {}
): Promise<AuditEvent[]> {
  try {
    const db = await getAuditDB();
    const tx = db.transaction(AUDIT_STORE, 'readonly');
    const store = tx.objectStore(AUDIT_STORE);

    let logs: any[] = [];

    if (filters.type) {
      const index = store.index('type');
      logs = await index.getAll(filters.type);
    } else {
      logs = await store.getAll();
    }

    // 解密並過濾日誌
    const decryptedLogs = logs.map(log => {
      try {
        return {
          ...log,
          details: log.encryptedDetails ? decryptData(log.encryptedDetails) : {}
        };
      } catch (error) {
        console.error('解密審計日誌失敗:', error);
        return {
          ...log,
          details: { error: '解密失敗' }
        };
      }
    });

    // 應用過濾器
    let filteredLogs = decryptedLogs.filter(log => {
      if (filters.action && log.action !== filters.action) return false;
      if (filters.success !== undefined && log.success !== filters.success) return false;
      if (filters.startTime && log.timestamp < filters.startTime) return false;
      if (filters.endTime && log.timestamp > filters.endTime) return false;
      return true;
    });

    // 按時間倒序排列
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);

    // 限制數量
    if (filters.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }

    return filteredLogs;

  } catch (error) {
    console.error('獲取審計日誌失敗:', error);
    return [];
  }
}

/**
 * 清理舊日誌
 */
async function cleanupOldLogs(): Promise<void> {
  try {
    const db = await getAuditDB();
    const tx = db.transaction(AUDIT_STORE, 'readwrite');
    const store = tx.objectStore(AUDIT_STORE);

    const count = await store.count();

    if (count > MAX_LOG_ENTRIES) {
      const index = store.index('timestamp');
      const cursor = await index.openCursor();

      let deletedCount = 0;
      const toDelete = count - MAX_LOG_ENTRIES + 100; // 多刪一些避免頻繁清理

      while (cursor && deletedCount < toDelete) {
        await cursor.delete();
        await cursor.continue();
        deletedCount++;
      }
    }

    await tx.done;
  } catch (error) {
    console.error('清理舊日誌失敗:', error);
  }
}

/**
 * 獲取審計統計
 */
export async function getAuditStats(): Promise<{
  totalEvents: number;
  todayEvents: number;
  successRate: number;
  topActions: { action: string; count: number }[];
  recentFailures: AuditEvent[];
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const allLogs = await getAuditLogs({ limit: 5000 });
    const todayLogs = allLogs.filter(log => log.timestamp >= todayTimestamp);
    const successCount = allLogs.filter(log => log.success).length;

    // 統計最常見的動作
    const actionCounts = new Map<string, number>();
    allLogs.forEach(log => {
      const count = actionCounts.get(log.action) || 0;
      actionCounts.set(log.action, count + 1);
    });

    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 最近的失敗事件
    const recentFailures = allLogs
      .filter(log => !log.success)
      .slice(0, 10);

    return {
      totalEvents: allLogs.length,
      todayEvents: todayLogs.length,
      successRate: allLogs.length > 0 ? (successCount / allLogs.length) * 100 : 0,
      topActions,
      recentFailures
    };

  } catch (error) {
    console.error('獲取審計統計失敗:', error);
    return {
      totalEvents: 0,
      todayEvents: 0,
      successRate: 0,
      topActions: [],
      recentFailures: []
    };
  }
}

/**
 * 清除所有審計日誌（管理員功能）
 */
export async function clearAuditLogs(): Promise<void> {
  try {
    const db = await getAuditDB();
    const tx = db.transaction(AUDIT_STORE, 'readwrite');
    await tx.objectStore(AUDIT_STORE).clear();
    await tx.done;

    // 記錄清除動作
    await logAuditEvent(
      AuditEventType.ADMIN,
      'clear_audit_logs',
      { reason: 'Manual cleanup by admin' }
    );

  } catch (error) {
    console.error('清除審計日誌失敗:', error);
    throw error;
  }
}

/**
 * 匯出審計日誌
 */
export async function exportAuditLogs(): Promise<string> {
  try {
    const logs = await getAuditLogs({ limit: 5000 });

    // 記錄匯出動作
    await logAuditEvent(
      AuditEventType.ADMIN,
      'export_audit_logs',
      { exportedCount: logs.length }
    );

    return JSON.stringify(logs, null, 2);

  } catch (error) {
    console.error('匯出審計日誌失敗:', error);
    throw error;
  }
}

// 快捷函數
export const auditAuth = (action: string, details?: Record<string, any>, success = true) =>
  logAuditEvent(AuditEventType.AUTH, action, details, success);

export const auditAdmin = (action: string, details?: Record<string, any>, success = true) =>
  logAuditEvent(AuditEventType.ADMIN, action, details, success);

export const auditData = (action: string, details?: Record<string, any>, success = true) =>
  logAuditEvent(AuditEventType.DATA, action, details, success);

export const auditSecurity = (action: string, details?: Record<string, any>, success = true) =>
  logAuditEvent(AuditEventType.SECURITY, action, details, success);