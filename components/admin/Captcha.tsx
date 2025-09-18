import { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Text,
  HStack,
  Button,
  Icon
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import { secureRandom } from '../../lib/security';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
  value: string;
  onChange: (value: string) => void;
}

export default function Captcha({ onVerify, value, onChange }: CaptchaProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(0);

  const generateQuestion = () => {
    const operations = ['+', '-', '*'];
    const operation = operations[secureRandom(0, operations.length)];

    let num1: number, num2: number, result: number;

    switch (operation) {
      case '+':
        num1 = secureRandom(10, 99);
        num2 = secureRandom(10, 99);
        result = num1 + num2;
        break;
      case '-':
        num1 = secureRandom(50, 99);
        num2 = secureRandom(10, 49);
        result = num1 - num2;
        break;
      case '*':
        num1 = secureRandom(2, 12);
        num2 = secureRandom(2, 12);
        result = num1 * num2;
        break;
      default:
        num1 = 10;
        num2 = 5;
        result = 15;
    }

    setQuestion(`${num1} ${operation} ${num2} = ?`);
    setAnswer(result);
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  useEffect(() => {
    const userAnswer = parseInt(value);
    if (!isNaN(userAnswer)) {
      onVerify(userAnswer === answer);
    } else {
      onVerify(false);
    }
  }, [value, answer, onVerify]);

  return (
    <FormControl>
      <FormLabel>安全驗證</FormLabel>
      <HStack spacing={3}>
        <Box
          px={4}
          py={3}
          bg="gray.100"
          borderRadius="md"
          fontFamily="monospace"
          fontSize="lg"
          fontWeight="bold"
          minW="120px"
          textAlign="center"
          userSelect="none"
        >
          {question}
        </Box>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="答案"
          maxW="80px"
          textAlign="center"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={generateQuestion}
          aria-label="刷新驗證碼"
        >
          <Icon as={FiRefreshCw} />
        </Button>
      </HStack>
      <Text fontSize="sm" color="gray.600" mt={2}>
        請回答上述數學問題以驗證您不是機器人
      </Text>
    </FormControl>
  );
}