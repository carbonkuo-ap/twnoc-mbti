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
import { extractOTPFromUrl } from "../../../../lib/otp";

export default function TestResultHistoryPage() {
  const router = useRouter();

  const [testResults, setTestResults] = useState<
    AsyncData<Result<Option<TestResult[]>, Error>>
  >(AsyncData.NotAsked());
  const [currentOtp, setCurrentOtp] = useState<string | null>(null);

  useEffect(() => {
    if (router.isReady) {
      setTestResults(AsyncData.Loading());

      // 獲取當前的 OTP Token
      const otpToken = extractOTPFromUrl() || localStorage.getItem('mbti_otp_token');
      setCurrentOtp(otpToken);

      // 只顯示當前 OTP 的歷史紀錄
      getAllSavedTestResult(otpToken || undefined).tap((result) =>
        setTestResults(AsyncData.Done(result))
      );
    }
  }, [router.isReady]);

  return (
    <MainLayout>
      <Flex direction="column" gap={4}>
        {currentOtp && (
          <Alert status="info">
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
                          {currentOtp ? '目前沒有使用此授權碼的測試紀錄' : '沒有測試紀錄'}
                        </Text>
                      </Flex>
                    )
                  ),
                  None: () => (
                    <Flex direction="column" alignItems="center" py={8}>
                      <Text fontSize="lg" color="gray.600">
                        {currentOtp ? '目前沒有使用此授權碼的測試紀錄' : '沒有測試紀錄'}
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
