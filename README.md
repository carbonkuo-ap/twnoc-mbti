# MBTI 性格測驗

## 專案簡介

本專案實作了 MBTI（Myers-Briggs Type Indicator）性格測試，透過一系列問題，幫助使用者瞭解自己的個性特徵，並確定他們的 MBTI 類型。MBTI 將個性分為四個維度，最終組合出 16 種性格類型，使用者可根據測試結果瞭解更多關於自己的資訊。

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-brightgreen)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Database-orange)
![OTP](https://img.shields.io/badge/OTP-Token%20Protected-blue)

部署在 GitHub Pages，造訪網址：[https://carbonkuo-ap.github.io/twnoc-mbti/](https://carbonkuo-ap.github.io/twnoc-mbti/)

**🔒 注意：本系統需要有效的 OTP Token 才能開始測試**

## 功能特性

### 🧠 核心測驗功能
- **🔒 OTP 授權驗證**：所有測試必須使用有效的 OTP Token 才能開始
- **16 種 MBTI 類型**：透過測試瞭解您屬於哪種 MBTI 類型（如：INTJ、ENFP）
- **使用者友好界面**：簡潔直觀的設計，引導使用者完成測試問題，支援點擊動畫反饋
- **結果展示**：測試結果展示您的 MBTI 類型，並提供詳細的性格描述
- **行動裝置相容**：支援桌電和行動裝置的存取
- **URL 自動驗證**：支援透過 URL 參數自動填入 OTP Token

### 🔐 管理後台功能
- **隱藏管理介面**：位於 `/mbti-admin` 的安全管理後台
- **即時統計監控**：總測試次數、今日測試數、最受歡迎類型
- **測試記錄管理**：查看所有測試歷史記錄和詳細資訊
- **可點擊人格報告**：點擊任何人格類型可查看標準化報告

### 🎯 OTP 授權系統
- **Token 授權機制**：建立有時效性的一次性測試授權碼
- **以天為單位過期**：可設定 1-365 天的有效期限
- **跨設備分享**：透過 URL 連結分享，任何設備都能存取
- **使用追蹤**：追蹤每個 Token 的使用次數和狀態

### ☁️ Firebase 雲端架構
- **Firebase Realtime Database**：所有資料完全儲存在雲端
- **即時同步**：測試結果立即同步到雲端資料庫
- **跨設備存取**：管理員可從任何設備存取完整資料
- **安全性保障**：移除本地儲存，避免資料同步衝突

### 📊 資料管理功能
- **Firebase 匯出**：從 Firebase 匯出完整測試記錄
- **OTP 管理**：完整的 Token 生命週期管理
- **審計日誌**：完整記錄所有操作歷史
- **統計分析**：即時顯示測試統計和 OTP 使用情況

## 技術堆疊

純前端架構，無需後端支援，支援靜態部署。

- **前端框架**: Next.js 13 (Static Export)
- **UI 元件庫**: Chakra UI
- **狀態管理**: Zustand
- **雲端資料庫**: Firebase Realtime Database (主要儲存)
- **資料安全**: AES 加密 + PBKDF2 雜湊
- **授權系統**: OTP (One-Time Password) Token 驗證
- **部署平台**: GitHub Pages

### 🔄 架構變更 (v2.0)
- ✅ **移除本地儲存依賴**: 不再使用 IndexedDB/localStorage
- ✅ **Firebase-only 架構**: 所有資料統一存放在 Firebase
- ✅ **簡化認證**: 移除 TOTP 雙因素認證，改用 OTP Token
- ✅ **強制授權**: 所有測試都需要有效的 OTP Token

## 本地運行

1. **複製程式碼儲存庫**：

   ```bash
   git clone git@github.com:carbonkuo-ap/twnoc-mbti.git
   ```

2. **安裝依賴**：進入專案目錄並安裝所需依賴：

   ```bash
   cd twnoc-mbti
   yarn
   ```

3. **啟動開發伺服器**：

   ```bash
   yarn dev
   ```

4. **設定環境變數**：

   ```bash
   cp .env.example .env.local
   # 編輯 .env.local 設定管理後台和 Firebase 配置
   ```

   **必要設定**：
   - `NEXT_PUBLIC_ADMIN_USERNAME`: 管理員帳號
   - `NEXT_PUBLIC_ADMIN_HASH`: 管理員密碼雜湊
   - `NEXT_PUBLIC_ADMIN_SALT`: 密碼加密鹽值
   - `NEXT_PUBLIC_ENCRYPTION_KEY`: 資料加密金鑰

   **Firebase 設定（必要）**：
   - `NEXT_PUBLIC_FIREBASE_DATABASE_URL`: Firebase Realtime Database URL
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API 金鑰
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase 專案 ID
   - 其他 Firebase 配置參數
   - 詳細設定請參考 [Firebase 設定指南](docs/FIREBASE_SETUP.md)

   **⚠️ 重要：由於採用 Firebase-only 架構，Firebase 配置為必要設定，否則系統無法正常運作。**

5. **存取應用程式**：
   在瀏覽器中開啟主控台輸出的連結，存取應用程式。

## 管理後台

本專案包含功能完整的管理員後台系統：

### 存取方式

- **網址**：`/mbti-admin`
- **認證**：管理員帳號密碼（已移除 TOTP 雙因素認證）

### 核心功能

#### 📊 統計儀表板
- **即時統計**：總測試次數、今日測試數、最受歡迎類型
- **Firebase 狀態**：顯示雲端同步連接狀態
- **OTP 統計**：活躍 Token 數量和使用情況

#### 🎯 OTP 授權管理
- **Token 建立**：設定有效期限（1-365天）和描述
- **分享連結**：一鍵複製可跨設備使用的測試連結
- **使用監控**：追蹤每個 Token 的使用次數和狀態
- **批次管理**：刪除、清理過期 Token

#### 📋 測試記錄管理
- **Firebase 資料**：查看所有 Firebase 雲端測試資料
- **OTP 追蹤**：顯示使用哪個 Token 進行的測試
- **可點擊報告**：點擊人格類型可查看標準化報告
- **即時更新**：測試完成後立即在後台顯示

#### 💾 資料管理
- **匯出功能**：從 Firebase 匯出 JSON 格式的完整資料
- **雲端同步**：所有資料即時同步到 Firebase
- **統計報表**：測試次數、OTP 使用率等統計資訊

### 使用流程

1. **建立授權**：在 OTP 管理中建立測試 Token
2. **分享連結**：複製包含 Token 的 URL 分享給測試者
3. **跨設備測試**：測試者在任何設備開啟連結進行測試
4. **即時監控**：管理後台即時顯示所有測試結果
5. **資料分析**：查看統計和點擊查看詳細報告

### 部署設定

#### GitHub Pages 環境變數

在 GitHub Repository Settings > Secrets and variables > Actions 中設定：

**基本設定**：
```
NEXT_PUBLIC_BASE_PATH=/your-repo-name
NEXT_PUBLIC_ADMIN_USERNAME=your-admin-username
NEXT_PUBLIC_ADMIN_HASH=your-password-hash
NEXT_PUBLIC_ADMIN_SALT=your-salt
NEXT_PUBLIC_ENCRYPTION_KEY=your-encryption-key
```

**Firebase 設定**（跨設備功能）：
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your-database-url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

#### GitHub Secrets 對應表

如果您已經在 GitHub 中設定了 Firebase 環境變數，請確認以下對應關係：

| GitHub Secret 名稱 | 對應的環境變數 |
|---|---|
| `BASE_PATH` | `NEXT_PUBLIC_BASE_PATH` |
| `ADMIN_USERNAME` | `NEXT_PUBLIC_ADMIN_USERNAME` |
| `ENCRYPTION_KEY` | `NEXT_PUBLIC_ENCRYPTION_KEY` |
| `ADMIN_HASH` | `NEXT_PUBLIC_ADMIN_HASH` |
| `ADMIN_SALT` | `NEXT_PUBLIC_ADMIN_SALT` |
| `FIREBASE_API_KEY` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `FIREBASE_AUTH_DOMAIN` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `FIREBASE_DATABASE_URL` | `NEXT_PUBLIC_FIREBASE_DATABASE_URL` |
| `FIREBASE_PROJECT_ID` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `FIREBASE_STORAGE_BUCKET` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `FIREBASE_MESSAGING_SENDER_ID` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `FIREBASE_APP_ID` | `NEXT_PUBLIC_FIREBASE_APP_ID` |

詳細的 Firebase 設定步驟請參考 **[Firebase 設定指南](docs/FIREBASE_SETUP.md)**。

## 🔒 安全性

本專案實作了多層次安全機制，包括：
- 🎯 **OTP Token 授權**：強制性的一次性密碼驗證
- 🛡️ **登入防護與速率限制**：防止暴力破解攻擊
- 🔒 **資料加密儲存**：敏感資料 AES 加密保護
- 📊 **審計日誌記錄**：完整記錄所有操作歷史
- 🚨 **會話安全管理**：安全的管理員會話控制
- ☁️ **Firebase 安全規則**：雲端資料庫存取控制

### 🔄 安全性改進 (v2.0)
- ✅ **簡化認證流程**：移除複雜的 TOTP 雙因素認證
- ✅ **統一授權機制**：所有測試使用 OTP Token 驗證
- ✅ **雲端安全**：Firebase 原生安全機制保護
- ✅ **減少攻擊面**：移除本地儲存相關安全風險

詳細的安全功能說明、配置指南和最佳實踐，請參考 **[安全性文件](docs/SECURITY.md)**。

## MBTI 類型簡介

MBTI（Myers-Briggs Type Indicator）將人格類型基於四個維度進行組合。以下是每個維度的介紹：

1. **外向（Extraversion, E） vs 內向（Introversion, I）**

   - **外向**：喜歡與人交往，透過與他人互動取得能量，傾向於關注外部世界，熱衷於活動和交流。
   - **內向**：更喜歡獨處或與少數人深度交流，透過獨處取得能量，關注內心世界，傾向於思考和反省。

2. **感覺（Sensing, S） vs 直覺（Intuition, N）**

   - **感覺**：注重實際的細節和資料，透過感官取得資訊，傾向於依靠經驗和事實做決策。
   - **直覺**：更關注全局和未來的可能性，透過聯想和直覺取得資訊，傾向於創新、理論和長遠的思考。

3. **思考（Thinking, T） vs 情感（Feeling, F）**

   - **思考**：重視邏輯和客觀分析，傾向於透過客觀標準和原則做出決策，追求公正和效率。
   - **情感**：重視人際關係和情感因素，傾向於基於價值觀和情感做決策，關注和諧和關懷。

4. **判斷（Judging, J） vs 知覺（Perceiving, P）**
   - **判斷**：喜歡有計劃、有條理地生活，傾向於快速做決定，注重控制和預見性，喜歡按計劃行事。
   - **知覺**：靈活、隨性，喜歡保留選擇的餘地，傾向於隨時適應變化，偏好開放性和多樣性。

透過這四個維度的組合，MBTI 產生了 16 種人格類型，每種類型都提供了不同的性格特徵與行為傾向。這種分類方法幫助人們瞭解自己的偏好、思維方式和與他人互動的模式。

PS: MBTI 測試雖然有一定的流行性，但它也有一定的爭議性，在學術心理學領域的科學性和可靠性經常受到質疑。

## 貢獻指南

您可以 Fork 本倉庫並提交 Pull Request 來進行代碼貢獻。

英文原文文件在這裡：[MBTI-personality-test.pdf](./public/MBTI-personality-test.pdf)，發現有翻譯不準確的地方，歡迎完善專案中的 `/data` 部分。

## 許可證

本專案使用 MIT 許可證授權。

## 致謝

[Rauf](https://github.com/rauf-21)
