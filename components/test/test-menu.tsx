import { Flex } from "@chakra-ui/react";

import TestTimer from "./test-timer";

export default function TestMenu() {
  return (
    <Flex
      width="full"
      my={2}
      px={4}
      direction="column"
      justifyContent="center"
      alignItems="flex-end"
      gap={2}
    >
      <Flex>
        <TestTimer />
      </Flex>
    </Flex>
  );
}
