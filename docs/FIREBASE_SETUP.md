# Firebase 設定指南

這份指南將幫助您設定 Firebase Realtime Database，這是 v2.0 系統運行的**必要條件**。

## 🎯 功能說明

Firebase 是 v2.0 系統的核心儲存服務，提供以下功能：
- **主要資料儲存**：所有測試結果和 OTP Token 都儲存在雲端
- **即時同步**：測試完成後立即同步到雲端資料庫
- **跨設備存取**：管理員可從任何設備存取完整資料
- **OTP 管理**：完整的 Token 生命週期管理
- **安全性保障**：雲端原生安全機制

## ⚠️ 重要提醒

**v2.0 系統完全依賴 Firebase**：
- 沒有 Firebase 配置，系統無法正常運行
- 不再支援本地 IndexedDB 儲存
- 所有測試和管理功能都需要 Firebase 連接

## 📋 設定步驟

### 1. 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「建立專案」或「Add project」
3. 輸入專案名稱（例如：`mbti-test-app`）
4. 選擇是否啟用 Google Analytics（可選）
5. 點擊「建立專案」

### 2. 啟用 Realtime Database

1. 在 Firebase Console 左側選單中，點擊「Realtime Database」
2. 點擊「建立資料庫」
3. 選擇資料庫位置（建議選擇離您最近的區域）
4. **重要**：先選擇「以測試模式啟動」，稍後我們會設定安全規則

### 3. 設定資料庫安全規則

在 Realtime Database 頁面：
1. 點擊「規則」標籤
2. 將以下規則複製貼上（替換預設規則）：

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "testResults": {
      ".read": true,
      ".write": true,
      ".indexOn": ["timestamp", "completedAt", "otpToken"]
    },
    "otpTokens": {
      ".read": true,
      ".write": true,
      ".indexOn": ["createdAt", "expiresAt", "usedAt"]
    },
    "otpUsage": {
      ".read": true,
      ".write": true,
      ".indexOn": ["usedAt", "token"]
    }
  }
}
```

### v2.0 資料結構說明

新版本的資料結構包含三個主要節點：

1. **testResults**: 儲存所有測試結果
2. **otpTokens**: 儲存 OTP Token 資訊
3. **otpUsage**: 儲存 Token 使用記錄

3. 點擊「發布」

### 4. 獲取 Web 應用程式配置

1. 在 Firebase Console 左側選單中，點擊「專案設定」（齒輪圖示）
2. 在「您的應用程式」區域，點擊「Web」圖示 (`</>`)
3. 輸入應用程式暱稱（例如：`MBTI Web App`）
4. **不要**勾選「同時為此應用程式設定 Firebase Hosting」
5. 點擊「註冊應用程式」
6. 複製 `firebaseConfig` 物件中的值

配置範例：
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "mbti-test-app.firebaseapp.com",
  databaseURL: "https://mbti-test-app-default-rtdb.firebaseio.com/",
  projectId: "mbti-test-app",
  storageBucket: "mbti-test-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 5. 設定環境變數

1. 複製 `.env.example` 為 `.env.local`：
   ```bash
   cp .env.example .env.local
   ```

2. 在 `.env.local` 中填入您的 Firebase 配置：
   ```env
   # Firebase 配置
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mbti-test-app.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://mbti-test-app-default-rtdb.firebaseio.com/
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=mbti-test-app
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mbti-test-app.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

3. 重新啟動開發伺服器：
   ```bash
   yarn dev
   ```

### 6. 測試 Firebase 連接

1. 開啟管理後台：`http://localhost:3001/mbti-admin`
2. 登入後查看統計卡片
3. 應該會看到「Firebase 狀態」顯示為「已連接」
4. 進行一次測試，檢查是否出現在管理後台的測試記錄中
5. 測試記錄應該顯示「來源: Firebase」

## 🚀 部署到 GitHub Pages

如果您要部署到 GitHub Pages，需要在 GitHub repository 中設定 Secrets：

1. 前往 GitHub repository 的 Settings → Secrets and variables → Actions
2. 添加以下 Repository secrets：
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=你的API金鑰
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=你的認證網域
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=你的資料庫URL
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=你的專案ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=你的儲存桶
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=你的發送者ID
   NEXT_PUBLIC_FIREBASE_APP_ID=你的應用程式ID
   ```

## 📊 功能驗證

設定完成後，您可以進行以下測試：

### 測試跨設備同步
1. 在管理後台建立 OTP Token
2. 複製分享連結，在不同設備/瀏覽器開啟
3. 完成測試
4. 在管理後台查看是否出現測試記錄
5. 記錄應該顯示正確的 OTP Token 和來源

### 測試即時監控
1. 開啟管理後台
2. 在另一個分頁進行測試
3. 測試完成後，管理後台應該即時更新測試數量
4. 新的測試記錄應該立即出現在列表中

## 🛡️ 安全性說明

### 目前的設定是測試用途
- 任何人都可以讀寫 `testResults` 和 `otpUsage`
- 適合個人或內部使用

### 生產環境建議
如果要用於生產環境，建議：
1. 設定更嚴格的安全規則
2. 啟用 Firebase Authentication
3. 根據使用者權限限制讀寫存取

## 🔧 故障排除

### Firebase 狀態顯示「未連接」
1. 檢查 `.env.local` 中的 Firebase 配置
2. 確認專案 ID 和 Database URL 正確
3. 檢查瀏覽器開發者工具的 Console 是否有錯誤
4. 重新啟動開發伺服器

### 測試記錄沒有同步到 Firebase
1. 檢查 Firebase Console 中的 Realtime Database
2. 確認資料庫規則允許寫入
3. 檢查瀏覽器網路標籤是否有 Firebase 請求失敗

### 管理後台無法看到跨設備測試
1. 確認測試時使用了 OTP Token
2. 檢查 Firebase 中是否有資料
3. 重新整理管理後台頁面

## 📞 需要協助？

如果遇到問題，請檢查：
1. Firebase Console 中的專案設定
2. `.env.local` 檔案的配置
3. 瀏覽器開發者工具的錯誤訊息
4. Firebase Realtime Database 的資料內容

---

✅ 設定完成後，您的 MBTI 測驗系統就具備完整的跨設備資料同步功能！