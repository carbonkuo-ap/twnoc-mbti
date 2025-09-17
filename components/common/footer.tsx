import Link from "next/link";
import { Flex, Text, Button } from "@chakra-ui/react";

export default function Footer() {
  return (
    <Flex
      as="footer"
      py={2}
      w="100%"
      h="full"
      bg="black"
      color="white"
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <Text>
        本網站上的所有測試都基於此{" "}
        <Link
          href="/MBTI-personality-test.pdf"
          target="_blank"
        >
          <Button
            colorScheme="primary"
            variant="link"
          >
            來源
          </Button>
        </Link>
      </Text>
      <Text>
        Made by{" "}
        <Link
          href="https://github.com/carbonkuo-ap"
          target="_blank"
        >
          <Button
            colorScheme="primary"
            variant="link"
          >
            carbonkuo-ap
          </Button>
        </Link>
      </Text>
    </Flex>
  );
}
