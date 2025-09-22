import { Flex, VStack, Icon, Text, Button } from "@chakra-ui/react";
import { FiShield, FiHome } from "react-icons/fi";
import { useRouter } from "next/router";
import MainLayout from "../components/layouts/main-layout";

export default function Forbidden() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <MainLayout>
      <Flex direction="column" alignItems="center" justifyContent="center" py={8}>
        <VStack spacing={6} textAlign="center">
          <Icon as={FiShield} boxSize={16} color="red.400" />
          <VStack spacing={2}>
            <Text fontSize="4xl" fontWeight="bold" color="gray.700">
              403
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.700">
              禁止訪問
            </Text>
            <Text fontSize="lg" color="gray.600" maxW="400px">
              您沒有權限訪問此頁面。請確保您已完成測試並使用有效的授權碼。
            </Text>
          </VStack>
          <Button
            leftIcon={<FiHome />}
            colorScheme="blue"
            size="lg"
            onClick={handleGoHome}
            borderRadius="xl"
          >
            返回首頁
          </Button>
        </VStack>
      </Flex>
    </MainLayout>
  );
}