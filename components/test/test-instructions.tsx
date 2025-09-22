import {
  Flex,
  Heading,
  Text,
  UnorderedList,
  ListItem,
  Button,
  Box,
} from "@chakra-ui/react";

interface TestInstructionsProps {
  onCloseTestInstructions: () => void;
}

export default function TestInstructions(props: TestInstructionsProps) {
  return (
    <Box position="relative" h="full" w="full">

      <Flex
        h="full"
        px={4}
        direction="column"
        gap={8}
        position="relative"
        zIndex={1}
      >
        <Heading>探索小提醒</Heading>
        <Flex
          direction="column"
          gap={2}
        >
          <Text>
            整份探索大概 15 分鐘就能完成～輕鬆來就好！
          </Text>
          <UnorderedList spacing={2}>
            <ListItem>
              沒有對或錯：放心，這不是考試，每個答案都只是反映你的偏好而已。
            </ListItem>
            <ListItem>
              直覺最重要：看到題目就選你第一個感覺的答案，不用想太多。
            </ListItem>
            <ListItem>
              做自己就好：請按照你平常的樣子回答，不用迎合別人。
            </ListItem>
          </UnorderedList>
        </Flex>
        <Flex justifyContent="center" w="full">
          <Button
            colorScheme="primary"
            onClick={props.onCloseTestInstructions}
            size="lg"
          >
            好的，我明白了！
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
