import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import "@fontsource/poppins/400.css";
import "../styles/animations.css";
import { useEffect } from "react";

import theme from "../theme";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // 全域錯誤處理
    const handleError = (error: ErrorEvent) => {
      console.error('應用程式錯誤:', error);

      // 如果是加密相關錯誤，清除可能損壞的資料
      if (error.message?.includes('解密') || error.message?.includes('crypto') || error.message?.includes('invalid')) {
        console.warn('檢測到加密錯誤，正在清除可能損壞的資料...');

        try {
          // 清除可能損壞的 localStorage 資料
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.includes('mbti') || key.includes('admin') || key.includes('auth')) {
              localStorage.removeItem(key);
            }
          });

          // 重新載入頁面
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (e) {
          console.error('清除資料時出錯:', e);
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('未處理的 Promise 拒絕:', event.reason);

      // 如果是 IndexedDB 相關錯誤
      if (event.reason?.message?.includes('database') || event.reason?.message?.includes('idb')) {
        console.warn('檢測到資料庫錯誤，正在重置...');

        try {
          indexedDB.deleteDatabase('MBTI_TEST_DB');
          indexedDB.deleteDatabase('MBTI_AUDIT_DB');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (e) {
          console.error('重置資料庫時出錯:', e);
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}
