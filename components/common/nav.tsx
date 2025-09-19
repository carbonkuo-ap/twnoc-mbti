import Link from "next/link";
import Image from "next/image";
import { Flex, Button } from "@chakra-ui/react";

export default function Nav() {
  return (
    <Flex
      as="nav"
      py={2}
      px={5}
      w="full"
      h={20}
      justifyContent="space-between"
      alignItems="center"
      overflowX="hidden"
    >
      <Flex
        gap={5}
        alignItems="center"
        overflowX="hidden"
      >
        <Link href="/">
          <Button
            colorScheme="black"
            variant="link"
            fontWeight="bold"
            textTransform="uppercase"
          >
            MBTI 性格測試
          </Button>
        </Link>
      </Flex>
    </Flex>
  );
}
