import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Heading,
  Text,
  Highlight,
  Flex,
  Button,
  Input,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Divider,
  Box
} from "@chakra-ui/react";
import { FiArrowRight } from "react-icons/fi";
import Image from "next/image";

import MainLayout from "../components/layouts/main-layout";

export default function HomePage() {
  const [otpToken, setOtpToken] = useState('');
  const [isOtpFromUrl, setIsOtpFromUrl] = useState(false);
  const router = useRouter();

  // 自動從 URL 或 localStorage 填入 OTP
  useEffect(() => {
    if (router.isReady) {
      const urlOtp = router.query.otp as string;
      if (urlOtp && urlOtp.trim() !== '') {
        setOtpToken(urlOtp.trim());
        setIsOtpFromUrl(true);
        // 保存到 localStorage
        localStorage.setItem('mbti_otp_token', urlOtp.trim());
      } else {
        // 嘗試從 localStorage 獲取
        const savedOtp = localStorage.getItem('mbti_otp_token');
        if (savedOtp && savedOtp.trim() !== '') {
          setOtpToken(savedOtp.trim());
          setIsOtpFromUrl(true);
        }
      }
    }
  }, [router.isReady, router.query.otp]);

  const handleStartTestWithOTP = () => {
    if (otpToken.trim()) {
      // 保存到 localStorage
      localStorage.setItem('mbti_otp_token', otpToken.trim());
      router.push(`/test?otp=${encodeURIComponent(otpToken.trim())}`);
    } else {
      router.push('/test');
    }
  };

  const handleClearOtp = () => {
    setOtpToken('');
    setIsOtpFromUrl(false);
    localStorage.removeItem('mbti_otp_token');
  };

  return (
    <>
      <MainLayout>
        <Flex
          position="relative"
          w={{
            base: "full",
            lg: "50%",
          }}
          alignSelf="center"
          px={4}
          pt={20}
          gap={8}
          h="calc(100vh - 80px)"
          direction="column"
          justifyContent="flex-start"
          alignItems="center"
          zIndex={1}
        >
          <Heading
            as="h1"
            lineHeight="tall"
            textAlign="center"
            fontSize={{ base: "2xl", md: "3xl" }}
          >
            <Highlight
              query="MBTI"
              styles={{
                py: 2,
                px: 6,
                rounded: "full",
                bg: "primary.500",
                color: "white",
                fontWeight: "bold",
              }}
            >
              MBTI 性格測試
            </Highlight>
          </Heading>
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            align="center"
            color="gray.600"
            fontWeight="medium"
            lineHeight="relaxed"
          >
            探索你的個性類型，更深入地認識自己
          </Text>

          <VStack spacing={8} w="full" maxW="450px">
            <Box w="full" p={6} bg="white" borderRadius="xl" shadow="lg" border="1px solid" borderColor="gray.200">
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel
                    textAlign="center"
                    mb={4}
                    fontSize={{ base: "lg", md: "xl" }}
                    fontWeight="bold"
                    color="gray.800"
                  >
                    {isOtpFromUrl ? '已獲取測試授權碼' : '請輸入測試授權碼'}
                  </FormLabel>
                  <Input
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value)}
                    placeholder={isOtpFromUrl ? "授權碼已自動填入" : "請輸入您的測試授權碼"}
                    textAlign="center"
                    size="lg"
                    bg={isOtpFromUrl ? "gray.50" : "white"}
                    border="2px solid"
                    borderColor={isOtpFromUrl ? "green.300" : "gray.300"}
                    isReadOnly={isOtpFromUrl}
                    _focus={{
                      borderColor: "primary.500",
                      boxShadow: "0 0 0 1px var(--chakra-colors-primary-500)"
                    }}
                    _readOnly={{
                      bg: "gray.50",
                      color: "gray.700",
                      cursor: "not-allowed"
                    }}
                  />
                  {isOtpFromUrl && (
                    <HStack justifyContent="center" mt={3}>
                      <Text fontSize="sm" color="green.600" fontWeight="medium">
                        ✓ 授權碼已驗證
                      </Text>
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="gray"
                        onClick={handleClearOtp}
                        fontSize="sm"
                      >
                        重新輸入
                      </Button>
                    </HStack>
                  )}
                </FormControl>
              </VStack>
            </Box>

            <Button
              w="full"
              colorScheme="primary"
              variant="solid"
              rightIcon={<FiArrowRight size={20} />}
              onClick={handleStartTestWithOTP}
              size="lg"
              py={6}
              fontSize="lg"
              fontWeight="bold"
              isDisabled={!otpToken.trim()}
              _disabled={{
                opacity: 0.6,
                cursor: "not-allowed"
              }}
            >
              {otpToken.trim() ? '開始測試' : '請先輸入授權碼'}
            </Button>
          </VStack>
        </Flex>
        <Image
          alt="illustration"
          src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/home-bottom.png`}
          width={100}
          height={100}
          style={{
            position: "absolute",
            zIndex: 0,
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: "600px",
            height: "auto",
          }}
        />
      </MainLayout>
    </>
  );
}
