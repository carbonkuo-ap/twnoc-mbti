import { useState, useEffect } from "react";
import { Flex } from "@chakra-ui/react";

import TestMenu from "./test-menu";
import TestInstructions from "./test-instructions";
import TestQuestion from "./test-question";
import OTPVerification from "./otp-verification";
import { extractOTPFromUrl } from "../../lib/otp";

export default function TestDisplay() {
  const [showTestInstructions, setShowTestInstructions] = useState(true);
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [verifiedOTPToken, setVerifiedOTPToken] = useState<string>('');
  const [showOTPModal, setShowOTPModal] = useState(false);

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
  }, []);

  function handleShowInstructionsButtonClick() {
    setShowTestInstructions(true);
  }

  function handleCloseTestInstructions() {
    setShowTestInstructions(false);
  }

  function handleOTPVerified(otpToken: string) {
    setVerifiedOTPToken(otpToken);
    setIsOTPVerified(true);
    setShowOTPModal(false);
  }

  function handleOTPModalClose() {
    // 如果用戶關閉 OTP 模態而沒有驗證，返回首頁
    window.location.href = '/';
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
          <TestMenu
            onShowInstructionsButtonClick={handleShowInstructionsButtonClick}
          />
          <Flex
            w={{
              lg: "50%",
              base: "100%",
            }}
            h="full"
          >
            {showTestInstructions ? (
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
