import { useState } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  HStack,
  Alert,
  AlertIcon,
  Link
} from '@chakra-ui/react';
import { verifyTOTPCode, verifyBackupCode, loadTOTPSetup } from '../../lib/totp';

interface TwoFactorInputProps {
  onVerify: (isValid: boolean) => void;
  onCancel: () => void;
}

export default function TwoFactorInput({ onVerify, onCancel }: TwoFactorInputProps) {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (!code.trim()) {
      setError('請輸入驗證碼');
      return;
    }

    const setup = loadTOTPSetup();
    if (!setup) {
      setError('2FA 設定不存在');
      return;
    }

    let isValid = false;

    if (useBackupCode) {
      // 驗證備用碼
      isValid = verifyBackupCode(code.trim());
      if (!isValid) {
        setError('備用碼無效或已使用');
      }
    } else {
      // 驗證 TOTP 碼
      if (code.length !== 6) {
        setError('驗證碼必須是 6 位數字');
        return;
      }
      isValid = verifyTOTPCode(code, setup.secret);
      if (!isValid) {
        setError('驗證碼不正確或已過期');
      }
    }

    if (isValid) {
      onVerify(true);
    }
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    setError('');
  };

  return (
    <VStack spacing={4} align="stretch">
      <Alert status="info">
        <AlertIcon />
        <Text fontSize="sm">
          {useBackupCode
            ? '請輸入 8 位數的備用恢復碼'
            : '請輸入您的 TOTP 應用程式顯示的 6 位數驗證碼'
          }
        </Text>
      </Alert>

      <FormControl>
        <FormLabel>
          {useBackupCode ? '備用恢復碼' : '驗證碼'}
        </FormLabel>
        <Input
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder={useBackupCode ? '12345678' : '000000'}
          maxLength={useBackupCode ? 8 : 6}
          textAlign="center"
          fontSize="xl"
          letterSpacing="wider"
          type={useBackupCode ? 'text' : 'number'}
        />
      </FormControl>

      {error && (
        <Alert status="error">
          <AlertIcon />
          <Text fontSize="sm">{error}</Text>
        </Alert>
      )}

      <VStack spacing={2}>
        <Button
          onClick={handleVerify}
          colorScheme="primary"
          width="full"
          isDisabled={!code.trim()}
        >
          驗證
        </Button>

        <HStack spacing={4} fontSize="sm">
          <Link
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
              setError('');
            }}
            color="blue.500"
          >
            {useBackupCode ? '使用 TOTP 應用程式' : '使用備用恢復碼'}
          </Link>

          <Link onClick={onCancel} color="gray.500">
            取消
          </Link>
        </HStack>
      </VStack>
    </VStack>
  );
}