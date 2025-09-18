import { useState } from "react";
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
  const router = useRouter();

  const handleStartTestWithOTP = () => {
    if (otpToken.trim()) {
      router.push(`/test?otp=${encodeURIComponent(otpToken.trim())}`);
    } else {
      router.push('/test');
    }
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
          >
            <Highlight
              query="MBTI"
              styles={{
                py: 1,
                px: 4,
                rounded: "full",
                bg: "primary.500",
                color: "white",
              }}
            >
              參加 MBTI 性格測試
            </Highlight>
          </Heading>
          <Text
            fontSize="xl"
            align="center"
          >
            通過這個性格測試更好地瞭解自己
          </Text>

          <VStack spacing={6} w="full" maxW="400px">
            <Box w="full">
              <FormControl>
                <FormLabel
                  textAlign="center"
                  mb={3}
                  fontSize="md"
                  fontWeight="bold"
                  color="gray.700"
                >
                  輸入 OTP Token (必填)
                </FormLabel>
                <Input
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value)}
                  placeholder="請輸入您的 OTP Token"
                  textAlign="center"
                  size="lg"
                  bg="white"
                  border="2px solid"
                  borderColor="gray.300"
                  _focus={{
                    borderColor: "primary.500",
                    boxShadow: "0 0 0 1px var(--chakra-colors-primary-500)"
                  }}
                />
              </FormControl>
            </Box>

            <Button
              w="full"
              colorScheme="primary"
              variant="solid"
              rightIcon={<FiArrowRight size={20} />}
              onClick={handleStartTestWithOTP}
              size="lg"
            >
              開始測試
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
