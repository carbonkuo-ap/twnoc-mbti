import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import "@fontsource/poppins/400.css";
import "../styles/animations.css";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useEffect } from "react";

import theme from "../theme";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // 全域錯誤處理 (Firebase-only 架構)
    const handleError = (error: ErrorEvent) => {
      console.error('應用程式錯誤:', error);

      // 如果是 Firebase 或加密相關錯誤
      if (error.message?.includes('firebase') ||
          error.message?.includes('crypto') ||
          error.message?.includes('invalid') ||
          error.message?.includes('解密')) {
        console.warn('檢測到應用程式錯誤，正在重新載入...');

        // 稍後重新載入頁面給用戶機會看到錯誤訊息
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('未處理的 Promise 拒絕:', event.reason);

      // 如果是 Firebase 相關錯誤
      if (event.reason?.message?.includes('firebase') ||
          event.reason?.message?.includes('database') ||
          event.reason?.code?.includes('permission-denied')) {
        console.warn('檢測到 Firebase 連接錯誤');
        // 不自動重新載入，讓用戶知道是網路或 Firebase 問題
      }
    };

    // 只在瀏覽器環境中添加事件監聽器
    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}
