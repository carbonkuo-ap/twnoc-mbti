import { Option, Future, Result } from "@swan-io/boxed";
import { personalityTest } from "../data/personality-test";
import { personalityClassGroup } from "../data/personality-class-groups";
import { saveTestResultToFirebase, getAllTestResultsFromFirebase, FirebaseTestResult } from "./firebase";

export interface TestQuestion {
  no: number;
  question: string;
  answerOptions: TestAnswerOption[];
}

export interface TestAnswerOption {
  type: "A" | "B";
  answer: string;
  score: PersonalityClass["type"];
}

export interface PersonalityClass {
  type:
    | Extroverted
    | Introverted
    | Sensing
    | Intuitive
    | Thinking
    | Feeling
    | Perceiving
    | Judging;
  description: string;
}

export interface PersonalityClassGroup {
  type: `${Extroverted | Introverted}${Sensing | Intuitive}${
    | Thinking
    | Feeling}${Perceiving | Judging}`;
  name: string;
  nameDescription: string;
  epithet: string;
  description: string;
  jungianFunctionalPreference: {
    dominant: string;
    auxiliary: string;
    tertiary: string;
    inferior: string;
  };
  generalTraits: string[];
  relationshipStrengths: string[];
  relationshipWeaknesses: string[];
  successDefinition: string;
  strengths: string[];
  gifts: string[];
  potentialProblemAreas: string[];
  explanationOfProblems: string;
  solutions: string;
  livingHappilyTips: string;
  suggestions?: string[];
  tenRulesToLive: string[];
}

export interface TestResult {
  timestamp: number;
  testAnswers: TestAnswerOption["type"][];
  testScores: PersonalityClass["type"][];
  otpToken?: string;
}

type Extroverted = "E";

type Introverted = "I";

type Sensing = "S";

type Intuitive = "N";

type Thinking = "T";

type Feeling = "F";

type Perceiving = "P";

type Judging = "J";

export function getQuestionAnswerScore(
  questionNumber: number,
  answerOption: TestAnswerOption["type"]
) {
  const question = personalityTest.find(
    (question) => question.no === questionNumber
  )!;

  return question.answerOptions.find((option) => option.type === answerOption)!
    .score;
}

export function getPersonalityClassGroupByTestScores(
  testScores: PersonalityClass["type"][]
) {
  const scoreCount = testScores.reduce(
    (acc, score) => {
      return {
        ...acc,
        [score]: acc[score] + 1,
      };
    },
    {
      E: 0,
      I: 0,
      S: 0,
      N: 0,
      T: 0,
      F: 0,
      J: 0,
      P: 0,
    }
  );

  const personalityClassGroupType = `${
    scoreCount.E >= scoreCount.I ? "E" : "I"
  }${scoreCount.S >= scoreCount.N ? "S" : "N"}${
    scoreCount.T >= scoreCount.F ? "T" : "F"
  }${scoreCount.J >= scoreCount.P ? "J" : "P"}`;

  return personalityClassGroup.find(
    ({ type }) => personalityClassGroupType === type
  )!;
}

export function getPersonalityClassGroupByType(type: string): PersonalityClassGroup {
  const group = personalityClassGroup.find(
    (personalityClass) => personalityClass.type === type
  );

  if (!group) {
    throw new Error(`未找到性格類型: ${type}`);
  }

  return group;
}

export function getSavedTestResult(id: string) {
  return Future.make<Result<Option<TestResult>, Error>>((resolve) => {
    getAllTestResultsFromFirebase()
      .then((results) => {
        const testResult = results.find(result => result.timestamp.toString() === id);
        resolve(Result.Ok(Option.fromNullable(testResult)));
      })
      .catch((error) => resolve(Result.Error(error)));
  });
}

export function getAllSavedTestResult() {
  return Future.make<Result<Option<TestResult[]>, Error>>((resolve) => {
    getAllTestResultsFromFirebase()
      .then((results) => {
        const testResults = results.map(result => ({
          timestamp: result.timestamp,
          testAnswers: result.testAnswers,
          testScores: result.testScores,
          otpToken: result.otpToken
        }));
        resolve(Result.Ok(Option.Some(testResults)));
      })
      .catch((error) => resolve(Result.Error(error)));
  });
}

export function saveTestResult(testResult: {
  timestamp: number;
  testAnswers: TestAnswerOption["type"][];
  testScores: PersonalityClass["type"][];
  otpToken?: string;
}) {
  return Future.make<Result<number, Error>>((resolve) => {
    saveTestResultToFirebase(testResult)
      .then((success) => {
        if (success) {
          resolve(Result.Ok(testResult.timestamp));
        } else {
          resolve(Result.Error(new Error('儲存到 Firebase 失敗')));
        }
      })
      .catch((error) => resolve(Result.Error(error)));
  });
}
