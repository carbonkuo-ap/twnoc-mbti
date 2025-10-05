import Link from "next/link";
import { Flex, Heading, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import { FiChevronRight } from "react-icons/fi";

import { TestResult } from "../../lib/personality-test";

interface TestResultHistoryProps {
  testResults: TestResult[];
}

export default function TestResultHistory(props: TestResultHistoryProps) {
  return (
    <Flex
      my={4}
      w={{
        base: "full",
        lg: "50%",
      }}
      h="full"
      px={8}
      gap={8}
      alignItems="center"
      direction="column"
    >
      <Heading
        as="h1"
        textAlign="center"
        whiteSpace="nowrap"
      >
        測試歷史
      </Heading>
      <Flex
        w="full"
        gap={4}
        direction="column"
        alignItems="center"
      >
        {props.testResults.map((testResult) => (
          <Flex
            key={testResult.timestamp}
            as={Link}
            href={`/test/result/?testResultId=${testResult.timestamp}`}
            py={4}
            px={6}
            rounded="lg"
            cursor="pointer"
            alignItems="center"
            justifyContent="center"
            gap={6}
            borderWidth={2}
            borderColor="gray.300"
            bg="white"
            transition="all 0.2s"
            _hover={{
              bg: "primary.50",
              borderColor: "primary.400",
              transform: "translateY(-2px)",
              shadow: "md",
            }}
            _active={{
              transform: "translateY(0)",
            }}
          >
            <Text whiteSpace="nowrap" fontSize="md" fontWeight="medium">
              {dayjs(testResult.timestamp).format("YYYY年MM月DD日 HH:mm")}
            </Text>
            <FiChevronRight size={20} />
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
}
