import { useState, useEffect } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { FiClock } from "react-icons/fi";
import useTestTimerStore from "../../store/use-test-timer";

const SECOND_IN_MILISECONDS = 1000;

export default function TestTimer() {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const { testStartTime } = useTestTimerStore();

  useEffect(() => {
    // 只有當測試開始時間存在時才開始計時
    if (!testStartTime) {
      setElapsedSeconds(0);
      return;
    }

    // 立即計算一次經過的時間
    const updateElapsedTime = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - testStartTime) / 1000);
      setElapsedSeconds(elapsed);
    };

    // 立即更新一次
    updateElapsedTime();

    // 設置定時器每秒更新
    const intervalId = setInterval(updateElapsedTime, SECOND_IN_MILISECONDS);

    return () => clearInterval(intervalId);
  }, [testStartTime]);

  return (
    <Flex
      width={110}
      px={2}
      columnGap={2}
      justifyContent="flex-start"
      alignItems="center"
      borderColor="blackAlpha.300"
      rounded="md"
    >
      <FiClock size={20} />
      <Text fontWeight="bold">
        {testStartTime ? (() => {
          const minutes = Math.floor(elapsedSeconds / 60);
          const seconds = elapsedSeconds % 60;
          return `${minutes.toString().padStart(2, "0")} : ${seconds.toString().padStart(2, "0")}`;
        })() : "-- : --"}
      </Text>
    </Flex>
  );
}
