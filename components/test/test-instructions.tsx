import {
  Flex,
  Heading,
  Text,
  UnorderedList,
  ListItem,
  Button,
  HStack,
} from "@chakra-ui/react";
import Link from "next/link";
import { BiHistory } from "react-icons/bi";

interface TestInstructionsProps {
  onCloseTestInstructions: () => void;
}

export default function TestInstructions(props: TestInstructionsProps) {
  return (
    <Flex
      h="full"
      px={4}
      direction="column"
      gap={8}
    >
      <Heading>說明</Heading>
      <Flex
        direction="column"
        gap={2}
      >
        <Text>
          完成測試大約只需要15分鐘。以下是一些完成這個測試的提示：
        </Text>
        <UnorderedList spacing={2}>
          <ListItem>
            這些問題沒有正確答案。
          </ListItem>
          <ListItem>
            快速回答問題，不要過度分析。有些可能措辭不當，選擇你感覺最合適的答案。
          </ListItem>
          <ListItem>
            根據「你實際的情況」回答問題，而不是「你希望別人如何看待你」。
          </ListItem>
        </UnorderedList>
      </Flex>
      <HStack justifyContent="space-between" w="full">
        <Link href="/test/result/history">
          <Button
            variant="outline"
            leftIcon={<BiHistory size={20} />}
            colorScheme="gray"
          >
            查看歷史紀錄
          </Button>
        </Link>
        <Button
          colorScheme="primary"
          onClick={props.onCloseTestInstructions}
        >
          好的，我明白了！
        </Button>
      </HStack>
    </Flex>
  );
}
