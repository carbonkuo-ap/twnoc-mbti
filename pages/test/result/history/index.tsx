import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Option, AsyncData, Result } from "@swan-io/boxed";
import { Flex, Text, Alert, AlertIcon } from "@chakra-ui/react";

import MainLayout from "../../../../components/layouts/main-layout";
import TestResultHistory from "../../../../components/test/test-result-history";
import {
  TestResult,
  getAllSavedTestResult,
} from "../../../../lib/personality-test";
import { extractOTPFromUrl, getOTPTokenInfo } from "../../../../lib/otp";

export default function TestResultHistoryPage() {
  const router = useRouter();

  const [testResults, setTestResults] = useState<
    AsyncData<Result<Option<TestResult[]>, Error>>
  >(AsyncData.NotAsked());
  const [currentOtp, setCurrentOtp] = useState<string | null>(null);
  const [isOtpValid, setIsOtpValid] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (router.isReady) {
      setIsLoading(true);
      setTestResults(AsyncData.Loading());

      // 獲取當前的 OTP Token
      const otpToken = extractOTPFromUrl() || localStorage.getItem('mbti_otp_token');
      setCurrentOtp(otpToken);

      // 驗證 OTP 是否存在且已被使用
      const validateOTPAccess = async () => {
        if (!otpToken) {
          // 沒有 OTP，跳轉到 403 頁面
          router.push('/403');
          return;
        }

        try {
          const otpInfo = await getOTPTokenInfo(otpToken);

          // 檢查 OTP 是否存在且已被使用
          if (otpInfo && otpInfo.usedAt) {
            setIsOtpValid(true);
            // 只有驗證通過才載入歷史紀錄
            getAllSavedTestResult(otpToken).tap((result) =>
              setTestResults(AsyncData.Done(result))
            );
          } else {
            // 無權訪問，跳轉到 403 頁面
            router.push('/403');
            return;
          }
        } catch (error) {
          console.error('驗證 OTP 失敗:', error);
          // 驗證失敗，跳轉到 403 頁面
          router.push('/403');
          return;
        } finally {
          setIsLoading(false);
        }
      };

      validateOTPAccess();
    }
  }, [router, router.isReady]);

  // 如果正在載入
  if (isLoading) {
    return (
      <MainLayout>
        <Flex direction="column" alignItems="center" justifyContent="center" py={8}>
          <Text fontSize="lg" color="gray.600">驗證權限中...</Text>
        </Flex>
      </MainLayout>
    );
  }

  // 顯示歷史記錄（只有通過驗證的用戶才會到達這裡）
  return (
    <MainLayout>
      <Flex direction="column" gap={4} alignItems="center">
        {currentOtp && (
          <Alert status="info" w={{ base: "full", lg: "auto" }} borderRadius="md" whiteSpace="nowrap">
            <AlertIcon />
            正在顯示測試授權碼 {currentOtp.substring(0, 8)}... 的歷史紀錄
          </Alert>
        )}
        {testResults.match({
          NotAsked: () => <Text>加載中</Text>,
          Loading: () => <Text>加載中</Text>,
          Done: (result) =>
            result.match({
              Error: () => <Text>出現錯誤！請刷新頁面！</Text>,
              Ok: (value) =>
                value.match({
                  Some: (data) => (
                    data.length > 0 ? (
                      <TestResultHistory testResults={data} />
                    ) : (
                      <Flex direction="column" alignItems="center" py={8}>
                        <Text fontSize="lg" color="gray.600">
                          目前沒有使用此授權碼的測試紀錄
                        </Text>
                      </Flex>
                    )
                  ),
                  None: () => (
                    <Flex direction="column" alignItems="center" py={8}>
                      <Text fontSize="lg" color="gray.600">
                        目前沒有使用此授權碼的測試紀錄
                      </Text>
                    </Flex>
                  ),
                }),
            }),
        })}
      </Flex>
    </MainLayout>
  );
}
