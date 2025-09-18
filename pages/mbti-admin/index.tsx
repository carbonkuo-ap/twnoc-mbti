import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
  Container
} from '@chakra-ui/react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { isAuthenticated, createAdminSession } from '../../lib/auth';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    // 如果已經登入，直接跳轉到儀表板
    if (isAuthenticated()) {
      router.push('/mbti-admin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        // 創建本地會話
        createAdminSession(username);

        toast({
          title: '登入成功',
          description: '歡迎使用 MBTI 管理後台',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // 跳轉到儀表板
        router.push('/mbti-admin/dashboard');
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('登入錯誤:', error);
      setError('登入過程中發生錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="md" py={20}>
      <Card>
        <CardBody>
          <VStack spacing={6}>
            <VStack spacing={2}>
              <Heading size="lg" textAlign="center">
                MBTI 管理後台
              </Heading>
              <Text color="gray.600" textAlign="center">
                請輸入管理員帳號密碼登入
              </Text>
            </VStack>

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>使用者名稱</FormLabel>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="請輸入使用者名稱"
                    autoComplete="username"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>密碼</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="請輸入密碼"
                      autoComplete="current-password"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                        icon={showPassword ? <FiEyeOff /> : <FiEye />}
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="primary"
                  size="lg"
                  width="full"
                  isLoading={isLoading}
                  loadingText="登入中..."
                  mt={4}
                >
                  登入
                </Button>
              </VStack>
            </form>

            <Text fontSize="sm" color="gray.500" textAlign="center">
              此頁面僅供授權管理員使用
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </Container>
  );
}