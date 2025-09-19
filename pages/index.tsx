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
              bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              borderRadius="2xl"
              shadow="2xl"
              border="1px solid"
              borderColor="purple.200"
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
                    fontSize="4xl"
                    mb={2}
                    role="img"
                    aria-label="key"
                    className="animate-float"
                  >
                    🔐
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
                      {isOtpFromUrl ? '✨ 已獲取測試授權碼' : '🎯 請輸入測試授權碼'}
                    </FormLabel>
                    <Box position="relative">
                      <Input
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value)}
                        placeholder={isOtpFromUrl ? "🎉 授權碼已自動填入" : "🔑 請輸入您的測試授權碼"}
                        textAlign="center"
                        size="lg"
                        bg={isOtpFromUrl ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.95)"}
                        border="3px solid"
                        borderColor={isOtpFromUrl ? "green.400" : "rgba(255,255,255,0.7)"}
                        isReadOnly={isOtpFromUrl}
                        fontSize="lg"
                        fontWeight="medium"
                        color={isOtpFromUrl ? "green.700" : "gray.700"}
                        _placeholder={{
                          color: "gray.500"
                        }}
                        _focus={{
                          borderColor: "yellow.400",
                          boxShadow: "0 0 0 3px rgba(255, 255, 0, 0.3), 0 0 20px rgba(255, 255, 0, 0.2)",
                          bg: "white",
                          transform: "scale(1.02)"
                        }}
                        _readOnly={{
                          bg: "rgba(255,255,255,0.9)",
                          color: "green.700",
                          cursor: "not-allowed",
                          fontWeight: "bold"
                        }}
                        transition="all 0.3s ease"
                      />
                      {isOtpFromUrl && (
                        <Box
                          position="absolute"
                          right="3"
                          top="50%"
                          transform="translateY(-50%)"
                          color="green.500"
                          fontSize="xl"
                        >
                          ✓
                        </Box>
                      )}
                    </Box>
                    {isOtpFromUrl && (
                      <HStack justifyContent="center" mt={4}>
                        <Text fontSize="sm" color="green.100" fontWeight="medium">
                          🎊 授權碼已驗證
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
                          🔄 重新輸入
                        </Button>
                      </HStack>
                    )}
                  </FormControl>
                </Box>
              </VStack>
            </Box>

            <Button
              w="full"
              bg="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
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
              borderColor="blue.300"
              _hover={{
                transform: "translateY(-3px)",
                shadow: "2xl",
                bg: "linear-gradient(135deg, #43a5f5 0%, #0288d1 100%)",
                borderColor: "blue.400"
              }}
              _active={{
                transform: "translateY(-1px)",
                shadow: "lg"
              }}
              _disabled={{
                opacity: 0.5,
                cursor: "not-allowed",
                transform: "none",
                bg: "gray.400",
                borderColor: "gray.300"
              }}
              transition="all 0.3s ease"
            >
              {otpToken.trim() ? '🚀 開始測試' : '🔐 請先輸入授權碼'}
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
