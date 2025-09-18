import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useRadioGroup, Flex, Text, Button } from "@chakra-ui/react";

import TestProgress from "./test-progress";
import TestAnswerOption from "./test-answer-option";

import { personalityTest } from "../../data/personality-test";
import {
  TestAnswerOption as TestAnswer,
  getQuestionAnswerScore,
  saveTestResult,
} from "../../lib/personality-test";
import { saveTestResultToFirebase } from "../../lib/firebase";
import { extractOTPFromUrl } from "../../lib/otp";
import useUserTestAnswersStore from "../../store/use-user-test-answers";

export default function TestQuestion() {
  const router = useRouter();

  const { userTestAnswers, setUserTestAnswers } = useUserTestAnswersStore();

  const [currentPersonalityTestIndex, setCurrentPersonalityTestIndex] =
    useState(0);

  const isUserAlreadyPickAnswer =
    userTestAnswers[currentPersonalityTestIndex] !== undefined;

  const { getRootProps, getRadioProps, setValue } = useRadioGroup({
    name: "answer",
    defaultValue: userTestAnswers[currentPersonalityTestIndex],
    onChange: (value) => {
      const newUserTestAnswers = [...userTestAnswers];

      newUserTestAnswers[currentPersonalityTestIndex] =
        value as TestAnswer["type"];

      setUserTestAnswers(newUserTestAnswers);

      handleNextButtonClick();
    },
  });

  const group = getRootProps();

  useEffect(() => {
    if (userTestAnswers[currentPersonalityTestIndex] === undefined) {
      setValue("");
      return;
    }

    setValue(userTestAnswers[currentPersonalityTestIndex]);
  }, [currentPersonalityTestIndex, userTestAnswers, setValue]);

  function handleNextButtonClick() {
    setCurrentPersonalityTestIndex((currentPersonalityTestIndex) => {
      if (currentPersonalityTestIndex + 1 > personalityTest.length - 1) {
        return currentPersonalityTestIndex;
      }

      return currentPersonalityTestIndex + 1;
    });
  }

  function handlePreviousButtonClick() {
    setCurrentPersonalityTestIndex((currentPersonalityTestIndex) => {
      if (currentPersonalityTestIndex - 1 < 0) {
        return currentPersonalityTestIndex;
      }

      return currentPersonalityTestIndex - 1;
    });
  }

  async function handleSeeResultButtonClick() {
    const timestamp = Date.now();
    const testScores = userTestAnswers.map((answer, index) =>
      getQuestionAnswerScore(index + 1, answer)
    );

    const testResult = {
      testAnswers: userTestAnswers,
      testScores,
      timestamp,
    };

    // 獲取 OTP Token（如果有的話）
    const otpToken = extractOTPFromUrl();

    // 同時保存到本地和 Firebase
    try {
      // 保存到本地 IndexedDB
      const localResult = await saveTestResult(testResult);

      localResult
        .tap(() => {
          setUserTestAnswers([]);
        })
        .tapOk(async (id) => {
          // 嘗試保存到 Firebase
          try {
            const firebaseSuccess = await saveTestResultToFirebase(testResult, otpToken || undefined);
            console.log('Firebase 保存結果:', firebaseSuccess ? '成功' : '失敗');
          } catch (firebaseError) {
            console.warn('Firebase 保存失敗:', firebaseError);
            // Firebase 失敗不影響本地功能
          }

          router.replace(`/test/result/?testResultId=${id}`);
        })
        .tapError((error) => {
          console.error('本地保存失敗:', error);
        });
    } catch (error) {
      console.error('測試結果保存過程發生錯誤:', error);
    }
  }

  return (
    <Flex
      py={4}
      w="full"
      h="full"
      gap={8}
      direction="column"
      justifyContent="space-between"
      alignItems="center"
    >
      <TestProgress />
      <Flex direction="column">
        <Text
          fontWeight="bold"
          align="center"
        >
          #{currentPersonalityTestIndex + 1}
        </Text>
        <Text
          fontSize="lg"
          align="center"
        >
          {personalityTest[currentPersonalityTestIndex].question}
        </Text>
      </Flex>
      <Flex
        w="full"
        gap={4}
        direction="column"
        {...group}
      >
        {personalityTest[currentPersonalityTestIndex].answerOptions.map(
          (answerOption) => {
            const radio = getRadioProps({ value: answerOption.type });

            return (
              <TestAnswerOption
                key={answerOption.type}
                {...radio}
              >
                {answerOption.answer}
              </TestAnswerOption>
            );
          }
        )}
      </Flex>
      <Flex
        direction="row"
        w="full"
        gap={4}
      >
        <Button
          w="full"
          variant="solid"
          {...(currentPersonalityTestIndex === 0 && {
            disabled: true,
          })}
          onClick={handlePreviousButtonClick}
        >
          上一題
        </Button>
        {isUserAlreadyPickAnswer &&
        currentPersonalityTestIndex === personalityTest.length - 1 ? (
          <Button
            w="full"
            colorScheme="primary"
            onClick={handleSeeResultButtonClick}
          >
            查看結果
          </Button>
        ) : (
          <Button
            w="full"
            colorScheme="primary"
            variant="solid"
            {...(!isUserAlreadyPickAnswer && {
              disabled: true,
            })}
            onClick={handleNextButtonClick}
          >
            下一題
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
