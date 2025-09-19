import { useState, useEffect } from "react";
import { Flex } from "@chakra-ui/react";

import TestMenu from "./test-menu";
import TestInstructions from "./test-instructions";
import TestQuestion from "./test-question";
import OTPVerification from "./otp-verification";
import { extractOTPFromUrl } from "../../lib/otp";
import useTestTimerStore from "../../store/use-test-timer";

export default function TestDisplay() {
  const [showTestInstructions, setShowTestInstructions] = useState(true);
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [verifiedOTPToken, setVerifiedOTPToken] = useState<string>('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [hasSeenInstructions, setHasSeenInstructions] = useState(false);
  const { setTestStartTime, resetTestTimer } = useTestTimerStore();

  useEffect(() => {
    // 檢查是否需要 OTP 驗證
    const urlOtpToken = extractOTPFromUrl();
    if (urlOtpToken && urlOtpToken.trim() !== '') {
      // 有 URL 參數，顯示 OTP 驗證模態
      setShowOTPModal(true);
    } else {
      // 沒有 URL 參數，也顯示 OTP 驗證模態要求輸入
      setShowOTPModal(true);
    }

    // 檢查是否已經看過說明
    const hasSeenInstructions = localStorage.getItem('mbti_has_seen_instructions') === 'true';
    if (hasSeenInstructions) {
      setShowTestInstructions(false);
      setHasSeenInstructions(true);
    }
  }, []);


  function handleCloseTestInstructions() {
    setShowTestInstructions(false);
    setHasSeenInstructions(true);
    // 保存到 localStorage，表示已經看過說明
    localStorage.setItem('mbti_has_seen_instructions', 'true');
    // 設定計時器開始時間
    const startTime = Date.now();
    setTestStartTime(startTime);
    console.log('計時器已啟動（關閉說明）:', new Date(startTime).toISOString());
  }

  function handleOTPVerified(otpToken: string) {
    setVerifiedOTPToken(otpToken);
    setIsOTPVerified(true);
    setShowOTPModal(false);
    // 重設計時器
    resetTestTimer();

    // 如果已經看過說明，立即開始計時
    const hasSeenInstructions = localStorage.getItem('mbti_has_seen_instructions') === 'true';
    if (hasSeenInstructions) {
      const startTime = Date.now();
      setTestStartTime(startTime);
      console.log('計時器已啟動（跳過說明）:', new Date(startTime).toISOString());
    }
  }

  function handleOTPModalClose() {
    // 如果用戶關閉 OTP 模態而沒有驗證，清除 localStorage 並返回首頁
    localStorage.removeItem('mbti_otp_token');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || '';
    window.location.href = `${baseUrl}/`;
  }

  return (
    <>
      <OTPVerification
        isOpen={showOTPModal}
        onClose={handleOTPModalClose}
        onVerified={handleOTPVerified}
      />

      {isOTPVerified && (
        <Flex
          alignSelf="flex-start"
          w="full"
          h="full"
          direction="column"
          justifyContent="center"
          alignItems="center"
          gap={2}
          px={1}
        >
          {!hasSeenInstructions && (
            <TestMenu />
          )}
          <Flex
            w={{
              lg: "50%",
              base: "100%",
            }}
            h="full"
          >
            {showTestInstructions && !hasSeenInstructions ? (
              <TestInstructions
                onCloseTestInstructions={handleCloseTestInstructions}
              />
            ) : (
              <TestQuestion />
            )}
          </Flex>
        </Flex>
      )}
    </>
  );
}
