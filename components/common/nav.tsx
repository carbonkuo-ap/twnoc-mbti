import Link from "next/link";
import Image from "next/image";
import { Flex, Button } from "@chakra-ui/react";

export default function Nav() {
  return (
    <Flex
      as="nav"
      py={3}
      px={5}
      w="full"
      h={20}
      justifyContent="space-between"
      alignItems="center"
      overflowX="hidden"
      bg="rgba(0, 0, 0, 0.3)"
      backdropFilter="blur(10px)"
      borderBottom="1px solid rgba(255, 255, 255, 0.1)"
      zIndex={1000}
    >
      <Flex
        gap={5}
        alignItems="center"
        overflowX="hidden"
      >
        <Link href="/">
          <Button
            color="white"
            variant="link"
            fontWeight="bold"
            fontSize="xl"
            textShadow="0 2px 8px rgba(0,0,0,0.5)"
            _hover={{
              color: "cyan.200",
              textShadow: "0 0 10px rgba(255,255,255,0.8)"
            }}
            transition="all 0.3s ease"
            p={2}
          >
            MBTI 性格測試
          </Button>
        </Link>
      </Flex>
    </Flex>
  );
}
