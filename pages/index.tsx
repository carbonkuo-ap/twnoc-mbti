import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  Heading,
  Text,
  Flex,
  Button,
  Input,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Box
} from "@chakra-ui/react";
import { FiArrowRight } from "react-icons/fi";

import { getAssetPath, getFaviconPath } from "../lib/utils/paths";

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
      <Head>
        <title>MBTI 性格測試</title>
        <meta name="description" content="探索你的個性類型，更深入地認識自己" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={getFaviconPath()} />
      </Head>

      <Flex
        h="100vh"
        w="100vw"
        overflow="hidden"
        direction={{ base: "column", lg: "row" }}
      >
        {/* 左側影片區 */}
        <Box
          position="relative"
          w={{ base: "100%", lg: "50%" }}
          h={{ base: "40vh", lg: "100vh" }}
          overflow="hidden"
          className="animate-slide-in-left"
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          >
            <source src={getAssetPath("/video/original-c8e62757e4f0b807908cbcc6962cad10.mp4")} type="video/mp4" />
          </video>

          {/* 深色遮罩 */}
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)"
          />
        </Box>

        {/* 右側表單區 */}
        <Flex
          w={{ base: "100%", lg: "50%" }}
          h={{ base: "60vh", lg: "100vh" }}
          bg="linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)"
          alignItems="center"
          justifyContent="center"
          p={{ base: 6, lg: 8 }}
          className="animate-slide-in-right"
        >
          <VStack spacing={{ base: 4, lg: 8 }} w="full" maxW="480px" align="center">
            {/* MBTI 標題 */}
            <VStack spacing={{ base: 2, lg: 4 }} textAlign="center" className="animate-fade-in-up animate-delay-200">
              <Box
                px={6}
                py={3}
                bg="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                borderRadius="full"
                shadow="lg"
                className="animate-scale-in animate-delay-400"
              >
                <Text
                  color="white"
                  fontWeight="bold"
                  fontSize={{ base: "xl", md: "2xl" }}
                  letterSpacing="wide"
                >
                  MBTI
                </Text>
              </Box>

              <Heading
                as="h1"
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="bold"
                color="gray.800"
                lineHeight="shorter"
              >
                性格測試
              </Heading>

              <Text
                fontSize={{ base: "lg", md: "xl" }}
                color="gray.600"
                fontWeight="medium"
                lineHeight="relaxed"
                maxW="400px"
              >
                探索你的個性類型，更深入地認識自己
              </Text>
            </VStack>

            {/* 表單卡片 */}
            <Box
              w="full"
              p={{ base: 6, lg: 8 }}
              bg="white"
              borderRadius="3xl"
              shadow="2xl"
              border="1px solid"
              borderColor="gray.100"
              position="relative"
              overflow="hidden"
              className="animate-fade-in-up animate-delay-400"
              _before={{
                content: '""',
                position: "absolute",
                top: "0",
                left: "0",
                right: "0",
                bottom: "0",
                bg: "linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(147,51,234,0.05) 100%)",
                zIndex: 0
              }}
            >
              <VStack spacing={6} position="relative" zIndex={1}>
                <FormControl>
                  <FormLabel
                    textAlign="center"
                    mb={4}
                    fontSize="lg"
                    fontWeight="semibold"
                    color="gray.700"
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
                      h={{ base: "48px", lg: "56px" }}
                      bg="gray.50"
                      border="2px solid"
                      borderColor={isOtpFromUrl ? "blue.300" : "gray.200"}
                      borderRadius="xl"
                      isReadOnly={isOtpFromUrl}
                      fontSize="lg"
                      fontWeight="medium"
                      color={isOtpFromUrl ? "blue.700" : "gray.700"}
                      _placeholder={{
                        color: "gray.400"
                      }}
                      _focus={{
                        borderColor: "blue.400",
                        boxShadow: "0 0 0 3px rgba(59,130,246,0.1)",
                        bg: "white",
                        transform: "scale(1.02)"
                      }}
                      _readOnly={{
                        bg: "blue.50",
                        color: "blue.700",
                        cursor: "not-allowed",
                        fontWeight: "bold",
                        borderColor: "blue.300"
                      }}
                      transition="all 0.3s ease"
                    />
                    {isOtpFromUrl && (
                      <Box
                        position="absolute"
                        right="4"
                        top="50%"
                        transform="translateY(-50%)"
                        color="blue.500"
                        fontSize="xl"
                      >
                        ✓
                      </Box>
                    )}
                  </Box>

                  {isOtpFromUrl && (
                    <HStack justifyContent="center" mt={4}>
                      <Text fontSize="sm" color="blue.600" fontWeight="medium">
                        授權碼已驗證
                      </Text>
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
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

            {/* 開始測試按鈕 */}
            <Button
              w="full"
              h={{ base: "48px", lg: "56px" }}
              bg="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
              color="white"
              variant="solid"
              rightIcon={<FiArrowRight size={20} />}
              onClick={handleStartTestWithOTP}
              fontSize="lg"
              fontWeight="bold"
              isDisabled={!otpToken.trim()}
              borderRadius="xl"
              shadow="lg"
              border="2px solid transparent"
              className="animate-fade-in-up animate-delay-600"
              _hover={{
                transform: "translateY(-2px)",
                shadow: "xl",
                bg: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)"
              }}
              _active={{
                transform: "translateY(0px)",
                shadow: "md"
              }}
              _disabled={{
                opacity: 0.5,
                cursor: "not-allowed",
                transform: "none",
                bg: "gray.300",
                color: "gray.500"
              }}
              transition="all 0.3s ease"
            >
              {otpToken.trim() ? '開始測試' : '請先輸入授權碼'}
            </Button>
          </VStack>
        </Flex>
      </Flex>
    </>
  );
}
