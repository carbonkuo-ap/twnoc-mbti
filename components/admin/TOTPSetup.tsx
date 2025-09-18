import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  FormControl,
  FormLabel,
  Image,
  Alert,
  AlertIcon,
  Code,
  Divider,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Grid,
  GridItem
} from '@chakra-ui/react';
import {
  generateTOTPSetup,
  saveTOTPSetup,
  loadTOTPSetup,
  enableTOTP,
  disableTOTP,
  isTOTPEnabled,
  regenerateBackupCodes,
  getRemainingBackupCodes,
  TOTPSetup
} from '../../lib/totp';

interface TOTPSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function TOTPSetupComponent({ isOpen, onClose, onComplete }: TOTPSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup' | 'manage'>('setup');
  const [setup, setSetup] = useState<TOTPSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      const existingSetup = loadTOTPSetup();
      if (existingSetup?.isEnabled) {
        setStep('manage');
        setSetup(existingSetup);
      } else {
        setStep('setup');
        initializeSetup();
      }
    }
  }, [isOpen]);

  const initializeSetup = async () => {
    setIsLoading(true);
    try {
      const newSetup = await generateTOTPSetup();
      setSetup(newSetup);
      saveTOTPSetup(newSetup);
    } catch (error) {
      toast({
        title: '設定失敗',
        description: '無法生成 2FA 設定',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = () => {
    if (!setup || !verificationCode) return;

    if (enableTOTP(verificationCode)) {
      setStep('backup');
      toast({
        title: '2FA 已啟用',
        description: '雙因素認證已成功啟用',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: '驗證失敗',
        description: '驗證碼不正確，請重試',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDisable2FA = () => {
    disableTOTP();
    setStep('setup');
    setSetup(null);
    toast({
      title: '2FA 已停用',
      description: '雙因素認證已停用',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleRegenerateBackupCodes = () => {
    try {
      const newCodes = regenerateBackupCodes();
      if (setup) {
        setSetup({ ...setup, backupCodes: newCodes });
      }
      setShowBackupCodes(true);
      toast({
        title: '備用碼已重新生成',
        description: '請妥善保存新的備用碼',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: '生成失敗',
        description: '無法重新生成備用碼',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const renderSetupStep = () => (
    <VStack spacing={6} align="stretch">
      <Text>
        請使用 Google Authenticator 或其他 TOTP 應用程式掃描下方 QR Code：
      </Text>

      {setup?.qrCodeUrl && (
        <Box textAlign="center">
          <Image
            src={setup.qrCodeUrl}
            alt="TOTP QR Code"
            mx="auto"
            maxW="200px"
          />
        </Box>
      )}

      <Alert status="info">
        <AlertIcon />
        <Text fontSize="sm">
          如果無法掃描 QR Code，請手動輸入此秘鑰：
          <Code ml={2}>{setup?.secret}</Code>
        </Text>
      </Alert>

      <Button onClick={() => setStep('verify')} colorScheme="blue">
        下一步：驗證設定
      </Button>
    </VStack>
  );

  const renderVerifyStep = () => (
    <VStack spacing={6} align="stretch">
      <Text>
        請輸入您的 TOTP 應用程式顯示的 6 位數驗證碼：
      </Text>

      <FormControl>
        <FormLabel>驗證碼</FormLabel>
        <Input
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="000000"
          maxLength={6}
          textAlign="center"
          fontSize="xl"
          letterSpacing="wider"
        />
      </FormControl>

      <HStack spacing={4}>
        <Button onClick={() => setStep('setup')} variant="outline">
          上一步
        </Button>
        <Button
          onClick={handleVerifyCode}
          colorScheme="green"
          isDisabled={verificationCode.length !== 6}
        >
          驗證並啟用
        </Button>
      </HStack>
    </VStack>
  );

  const renderBackupStep = () => (
    <VStack spacing={6} align="stretch">
      <Alert status="warning">
        <AlertIcon />
        <Text fontSize="sm">
          請妥善保存以下備用恢復碼。當您無法使用 TOTP 應用程式時，可以使用這些碼登入。
        </Text>
      </Alert>

      <Box bg="gray.50" p={4} borderRadius="md">
        <Grid templateColumns="repeat(2, 1fr)" gap={2}>
          {setup?.backupCodes.map((code, index) => (
            <GridItem key={index}>
              <Code>{code}</Code>
            </GridItem>
          ))}
        </Grid>
      </Box>

      <Alert status="error">
        <AlertIcon />
        <Text fontSize="sm">
          每個備用碼只能使用一次。請將這些碼保存在安全的地方。
        </Text>
      </Alert>

      <Button onClick={handleComplete} colorScheme="blue">
        完成設定
      </Button>
    </VStack>
  );

  const renderManageStep = () => (
    <VStack spacing={6} align="stretch">
      <Alert status="success">
        <AlertIcon />
        <Text>雙因素認證已啟用並正常運作。</Text>
      </Alert>

      <VStack spacing={4} align="stretch">
        <Text fontWeight="bold">備用恢復碼</Text>
        <Text fontSize="sm" color="gray.600">
          剩餘 {getRemainingBackupCodes()} 個備用碼
        </Text>

        <HStack spacing={4}>
          <Button
            onClick={() => setShowBackupCodes(true)}
            variant="outline"
            size="sm"
          >
            查看備用碼
          </Button>
          <Button
            onClick={handleRegenerateBackupCodes}
            variant="outline"
            size="sm"
          >
            重新生成備用碼
          </Button>
        </HStack>
      </VStack>

      <Divider />

      <Button
        onClick={handleDisable2FA}
        colorScheme="red"
        variant="outline"
      >
        停用雙因素認證
      </Button>
    </VStack>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {step === 'setup' && '設定雙因素認證'}
          {step === 'verify' && '驗證設定'}
          {step === 'backup' && '備用恢復碼'}
          {step === 'manage' && '管理雙因素認證'}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6}>
          {isLoading ? (
            <Text textAlign="center">正在生成設定...</Text>
          ) : (
            <>
              {step === 'setup' && renderSetupStep()}
              {step === 'verify' && renderVerifyStep()}
              {step === 'backup' && renderBackupStep()}
              {step === 'manage' && renderManageStep()}
            </>
          )}
        </ModalBody>
      </ModalContent>

      {/* 備用碼查看 Modal */}
      <Modal isOpen={showBackupCodes} onClose={() => setShowBackupCodes(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>備用恢復碼</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Box bg="gray.50" p={4} borderRadius="md" w="full">
                <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                  {setup?.backupCodes.map((code, index) => (
                    <GridItem key={index}>
                      <Code>{code}</Code>
                    </GridItem>
                  ))}
                </Grid>
              </Box>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                請妥善保存這些備用碼，每個碼只能使用一次。
              </Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Modal>
  );
}