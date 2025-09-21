/**
 * 路徑工具函數
 * 統一處理 GitHub Pages 部署時的路徑問題
 */

/**
 * 獲取基礎路徑
 * @returns 基礎路徑字串
 */
export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

/**
 * 獲取完整的資源路徑
 * @param path 相對路徑
 * @returns 包含 basePath 的完整路徑
 */
export function getAssetPath(path: string): string {
  const basePath = getBasePath();
  // 確保路徑格式正確
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
}

/**
 * 獲取圖片路徑
 * @param imagePath 圖片相對路徑
 * @returns 包含 basePath 的完整圖片路徑
 */
export function getImagePath(imagePath: string): string {
  return getAssetPath(imagePath);
}

/**
 * 獲取 favicon 路徑
 * @returns favicon 完整路徑
 */
export function getFaviconPath(): string {
  return getAssetPath('/favicon.ico');
}

/**
 * 檢查是否為 GitHub Pages 部署環境
 * @returns 是否為 GitHub Pages 環境
 */
export function isGitHubPages(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_BASE_PATH);
}