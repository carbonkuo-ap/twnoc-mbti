import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  VStack,
  Text,
  Alert,
  AlertIcon,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Spinner,
  Box
} from '@chakra-ui/react';
import { validateOTPTokenAsync, extractOTPFromUrl } from '../../lib/otp';

interface OTPVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (otpToken: string) => void;
}

export default function OTPVerification({ isOpen, onClose, onVerified }: OTPVerificationProps) {
  const [otpToken, setOtpToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [isAutoChecking, setIsAutoChecking] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // 檢查 URL 中是否有 OTP token
      const urlOtpToken = extractOTPFromUrl();
      if (urlOtpToken && urlOtpToken.trim() !== '') {
        setOtpToken(urlOtpToken);
        handleVerify(urlOtpToken);
      } else {
        setIsAutoChecking(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleVerify = async (tokenToVerify?: string) => {
    const token = tokenToVerify || otpToken;

    if (!token.trim()) {
      setError('請輸入 OTP Token');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const validation = await validateOTPTokenAsync(token.trim());

      if (validation.valid) {
        onVerified(token.trim());
      } else {
        setError(validation.error || '無效的 OTP Token');
      }
    } catch (error) {
      setError('驗證過程發生錯誤，請稍後再試');
      console.error('OTP 驗證錯誤:', error);
    } finally {
      setIsVerifying(false);
      setIsAutoChecking(false);
    }
  };

  const handleButtonClick = () => {
    handleVerify();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtpToken(e.target.value);
    if (error) setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>驗證測試授權</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isAutoChecking ? (
            <Box textAlign="center" py={8}>
              <Spinner size="lg" color="primary.500" />
              <Text mt={4}>正在檢查授權...</Text>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <Text color="gray.600">
                  請輸入有效的 OTP Token 以開始測試
                </Text>

                <FormControl isInvalid={!!error}>
                  <FormLabel>OTP Token</FormLabel>
                  <Input
                    value={otpToken}
                    onChange={handleInputChange}
                    placeholder="請輸入 OTP Token"
                    isDisabled={isVerifying}
                    autoFocus
                  />
                  <FormErrorMessage>{error}</FormErrorMessage>
                </FormControl>

                {error && (
                  <Alert status="error" rounded="md">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}
              </VStack>
            </form>
          )}
        </ModalBody>

        {!isAutoChecking && (
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              取消
            </Button>
            <Button
              colorScheme="primary"
              onClick={handleButtonClick}
              isLoading={isVerifying}
              loadingText="驗證中..."
              isDisabled={!otpToken.trim()}
            >
              驗證
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}