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
import { isAuthenticated, createAdminSession, validateAdminCredentials } from '../../lib/auth';
import {
  recordLoginFailure,
  recordLoginSuccess,
  isLoginBlocked,
  shouldShowCaptcha,
  getLoginDelay,
  formatRemainingTime
} from '../../lib/login-protection';
import Captcha from '../../components/admin/Captcha';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaValid, setCaptchaValid] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    // 如果已經登入，直接跳轉到儀表板
    const checkAuth = async () => {
      if (await isAuthenticated()) {
        router.push('/mbti-admin/dashboard');
      }
    };
    checkAuth();

    // 檢查是否需要顯示驗證碼
    setShowCaptcha(shouldShowCaptcha());

    // 檢查是否被封鎖
    const blockStatus = isLoginBlocked();
    if (blockStatus.blocked && blockStatus.remainingTime) {
      setCountdown(Math.ceil(blockStatus.remainingTime / 1000));
      setError(`帳號已被鎖定，請等待 ${formatRemainingTime(blockStatus.remainingTime)} 後再試`);
    }
  }, [router]);

  // 倒數計時器
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        if (countdown === 1) {
          setError('');
          setShowCaptcha(shouldShowCaptcha());
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 檢查是否被封鎖
    const blockStatus = isLoginBlocked();
    if (blockStatus.blocked) {
      setError(`帳號已被鎖定，請等待 ${formatRemainingTime(blockStatus.remainingTime || 0)} 後再試`);
      return;
    }

    // 檢查驗證碼
    if (showCaptcha && !captchaValid) {
      setError('請完成安全驗證');
      return;
    }

    // 實作登入延遲
    const delay = getLoginDelay();
    if (delay > 0) {
      setError(`請等待 ${Math.ceil(delay / 1000)} 秒後再試`);
      setTimeout(() => setError(''), delay);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 驗證憑證
      if (validateAdminCredentials(username, password)) {
        // 登入成功
        recordLoginSuccess();
        await createAdminSession(username);

        toast({
          title: '登入成功',
          description: '歡迎使用 MBTI 管理後台',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        router.push('/mbti-admin/dashboard');
      } else {
        // 登入失敗
        recordLoginFailure();
        setShowCaptcha(shouldShowCaptcha());

        const newBlockStatus = isLoginBlocked();
        if (newBlockStatus.blocked) {
          setCountdown(Math.ceil((newBlockStatus.remainingTime || 0) / 1000));
          setError(`登入失敗次數過多，帳號已被鎖定 ${formatRemainingTime(newBlockStatus.remainingTime || 0)}`);
        } else {
          setError('帳號或密碼錯誤');
        }

        // 清空表單
        setPassword('');
        setCaptchaValue('');
        setCaptchaValid(false);
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

                {showCaptcha && (
                  <Captcha
                    onVerify={setCaptchaValid}
                    value={captchaValue}
                    onChange={setCaptchaValue}
                  />
                )}

                <Button
                  type="submit"
                  colorScheme="primary"
                  size="lg"
                  width="full"
                  isLoading={isLoading}
                  loadingText="登入中..."
                  isDisabled={countdown > 0 || (showCaptcha && !captchaValid)}
                  mt={4}
                >
                  {countdown > 0 ? `等待 ${countdown} 秒` : '登入'}
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