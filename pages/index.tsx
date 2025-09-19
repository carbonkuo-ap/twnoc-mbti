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

          <VStack spacing={8} w="full" maxW="480px">
            <Box
              w="full"
              p={8}
              bg="linear-gradient(135deg, #2563eb 0%, #1e40af 100%)"
              borderRadius="2xl"
              shadow="2xl"
              border="1px solid"
              borderColor="primary.300"
              position="relative"
              overflow="hidden"
              className="animate-bounce-in animate-pulse-glow"
              _before={{
                content: '""',
                position: "absolute",
                top: "-50%",
                left: "-50%",
                width: "200%",
                height: "200%",
                background: "linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)",
                transform: "rotate(45deg)",
                transition: "all 0.6s",
                opacity: 0
              }}
              _hover={{
                transform: "translateY(-2px)",
                shadow: "3xl",
                _before: {
                  opacity: 1,
                  animation: "shimmer 1.5s ease-in-out infinite"
                }
              }}
              transition="all 0.3s ease"
            >
              <VStack spacing={6}>
                <Box textAlign="center">
                  <Text
                    fontSize="3xl"
                    mb={2}
                    role="img"
                    aria-label="psychology"
                    className="animate-float"
                  >
                    🧠
                  </Text>
                  <FormControl>
                    <FormLabel
                      textAlign="center"
                      mb={4}
                      fontSize={{ base: "lg", md: "xl" }}
                      fontWeight="bold"
                      color="white"
                      textShadow="0 2px 4px rgba(0,0,0,0.3)"
                    >
                      {isOtpFromUrl ? '授權碼已確認' : '請輸入測試授權碼'}
                    </FormLabel>
                    <Box position="relative">
                      <Input
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value)}
                        placeholder={isOtpFromUrl ? "授權碼已自動填入" : "請輸入您的測試授權碼"}
                        textAlign="center"
                        size="lg"
                        bg={isOtpFromUrl ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.95)"}
                        border="2px solid"
                        borderColor={isOtpFromUrl ? "psychology.400" : "primary.200"}
                        isReadOnly={isOtpFromUrl}
                        fontSize="lg"
                        fontWeight="medium"
                        color={isOtpFromUrl ? "psychology.700" : "neutral.700"}
                        _placeholder={{
                          color: "neutral.500"
                        }}
                        _focus={{
                          borderColor: "accent.400",
                          boxShadow: "0 0 0 3px rgba(251, 146, 60, 0.2)",
                          bg: "white",
                          transform: "scale(1.02)"
                        }}
                        _readOnly={{
                          bg: "rgba(255,255,255,0.95)",
                          color: "psychology.700",
                          cursor: "not-allowed",
                          fontWeight: "bold",
                          borderColor: "psychology.400"
                        }}
                        transition="all 0.3s ease"
                      />
                      {isOtpFromUrl && (
                        <Box
                          position="absolute"
                          right="3"
                          top="50%"
                          transform="translateY(-50%)"
                          color="psychology.500"
                          fontSize="xl"
                        >
                          ✓
                        </Box>
                      )}
                    </Box>
                    {isOtpFromUrl && (
                      <HStack justifyContent="center" mt={4}>
                        <Text fontSize="sm" color="psychology.100" fontWeight="medium">
                          授權碼已驗證
                        </Text>
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="whiteAlpha"
                          onClick={handleClearOtp}
                          fontSize="sm"
                          color="white"
                          _hover={{
                            bg: "rgba(255,255,255,0.2)"
                          }}
                        >
                          重新輸入
                        </Button>
                      </HStack>
                    )}
                  </FormControl>
                </Box>
              </VStack>
            </Box>

            <Button
              w="full"
              bg="linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)"
              color="white"
              variant="solid"
              rightIcon={<FiArrowRight size={24} />}
              onClick={handleStartTestWithOTP}
              size="lg"
              py={7}
              fontSize="xl"
              fontWeight="bold"
              isDisabled={!otpToken.trim()}
              borderRadius="xl"
              shadow="lg"
              border="2px solid"
              borderColor="psychology.400"
              _hover={{
                transform: "translateY(-3px)",
                shadow: "2xl",
                bg: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                borderColor: "psychology.500"
              }}
              _active={{
                transform: "translateY(-1px)",
                shadow: "lg"
              }}
              _disabled={{
                opacity: 0.6,
                cursor: "not-allowed",
                transform: "none",
                bg: "neutral.400",
                borderColor: "neutral.300"
              }}
              transition="all 0.3s ease"
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
