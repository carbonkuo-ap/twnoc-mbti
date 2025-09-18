import { useRadio, Box } from "@chakra-ui/react";

export default function TestAnswerOption(props: any) {
  const { getInputProps, getCheckboxProps } = useRadio(props);
  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Box
      w="full"
      as="label"
    >
      <input {...input} />
      <Box
        px={5}
        py={3}
        cursor="pointer"
        borderWidth={1}
        borderRadius="md"
        borderColor="black"
        userSelect="none"
        transition="all 0.2s ease-in-out"
        transform="scale(1)"
        _hover={{
          bg: "gray.50",
          borderColor: "primary.400",
          transform: "scale(1.02)",
          shadow: "md",
        }}
        _active={{
          transform: "scale(0.98)",
        }}
        _checked={{
          bg: "primary.500",
          color: "white",
          borderColor: "primary.500",
          transform: "scale(1.02)",
          shadow: "lg",
        }}
        _focus={{
          boxShadow: "outline",
        }}
        {...checkbox}
      >
        {props.children}
      </Box>
    </Box>
  );
}
