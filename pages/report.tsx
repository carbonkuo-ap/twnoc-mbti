import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  VStack,
  Heading,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Box,
  Divider,
  List,
  ListItem,
  ListIcon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Alert,
  AlertIcon,
  Spinner,
  Flex,
  Button,
  HStack
} from '@chakra-ui/react';
import { FiCheck, FiArrowLeft, FiBarChart } from 'react-icons/fi';
import Link from 'next/link';
import { personalityClassGroup } from '../data/personality-class-groups';
import { getAllSavedTestResult, getPersonalityClassGroupByTestScores, TestResult } from '../lib/personality-test';

interface PersonalityStats {
  totalTests: number;
  typeCount: number;
  percentage: number;
  answerStats: {
    [key: string]: number;
  };
}

export default function ReportPage() {
  const router = useRouter();
  const { type } = router.query;
  const [personalityData, setPersonalityData] = useState<any>(null);
  const [stats, setStats] = useState<PersonalityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (type && typeof type === 'string') {
      loadPersonalityData(type);
      loadPersonalityStats(type);
    }
  }, [type]);

  const loadPersonalityData = (personalityType: string) => {
    const data = personalityClassGroup.find(p => p.type === personalityType);
    if (data) {
      setPersonalityData(data);
    } else {
      setError('找不到指定的人格類型');
    }
  };

  const loadPersonalityStats = async (personalityType: string) => {
    try {
      setIsLoading(true);
      const result = await getAllSavedTestResult();

      result.match({
        Ok: (option) => {
          option.match({
            Some: (testResults) => {
              const stats = calculatePersonalityStats(testResults, personalityType);
              setStats(stats);
            },
            None: () => {
              setStats({
                totalTests: 0,
                typeCount: 0,
                percentage: 0,
                answerStats: {}
              });
            }
          });
        },
        Error: (err) => {
          console.error('載入統計資料失敗:', err);
          setError('無法載入統計資料');
        }
      });
    } catch (error) {
      console.error('載入人格統計失敗:', error);
      setError('載入統計時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePersonalityStats = (testResults: TestResult[], targetType: string): PersonalityStats => {
    const totalTests = testResults.length;
    const typeTests = testResults.filter(test => {
      const personalityGroup = getPersonalityClassGroupByTestScores(test.testScores);
      return personalityGroup.type === targetType;
    });

    const typeCount = typeTests.length;
    const percentage = totalTests > 0 ? (typeCount / totalTests) * 100 : 0;

    // 統計答案分布
    const answerStats: { [key: string]: number } = {};
    typeTests.forEach(test => {
      test.testAnswers.forEach((answer, index) => {
        const key = `Q${index + 1}_${answer}`;
        answerStats[key] = (answerStats[key] || 0) + 1;
      });
    });

    return {
      totalTests,
      typeCount,
      percentage,
      answerStats
    };
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'INTJ': 'purple', 'INTP': 'blue', 'ENTJ': 'red', 'ENTP': 'orange',
      'INFJ': 'teal', 'INFP': 'green', 'ENFJ': 'pink', 'ENFP': 'yellow',
      'ISTJ': 'gray', 'ISFJ': 'cyan', 'ESTJ': 'blackAlpha', 'ESFJ': 'linkedin',
      'ISTP': 'whiteAlpha', 'ISFP': 'messenger', 'ESTP': 'telegram', 'ESFP': 'whatsapp'
    };
    return colors[type] || 'gray';
  };

  if (isLoading) {
    return (
      <Container maxW="4xl" py={8}>
        <Flex justify="center" align="center" h="50vh">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text>載入中...</Text>
          </VStack>
        </Flex>
      </Container>
    );
  }

  if (error || !personalityData) {
    return (
      <Container maxW="4xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          {error || '找不到指定的人格類型'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 返回按鈕 */}
        <HStack>
          <Link href="/mbti-admin/dashboard">
            <Button leftIcon={<FiArrowLeft />} variant="outline">
              返回管理後台
            </Button>
          </Link>
        </HStack>

        {/* 標題區域 */}
        <Box textAlign="center">
          <Badge colorScheme={getTypeColor(personalityData.type)} fontSize="2xl" p={4} borderRadius="lg">
            {personalityData.type}
          </Badge>
          <Heading size="xl" mt={4}>
            {personalityData.name}
          </Heading>
          <Text fontSize="lg" color="gray.600" mt={2}>
            {personalityData.nameDescription}
          </Text>
          <Text fontSize="md" fontStyle="italic" mt={2}>
            「{personalityData.epithet}」
          </Text>
        </Box>

        {/* 統計資料 */}
        {stats && (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>測試總數</StatLabel>
                  <StatNumber>{stats.totalTests}</StatNumber>
                  <StatHelpText>所有測試記錄</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>此類型數量</StatLabel>
                  <StatNumber>{stats.typeCount}</StatNumber>
                  <StatHelpText>獲得此人格類型的測試數</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>佔比</StatLabel>
                  <StatNumber>{stats.percentage.toFixed(1)}%</StatNumber>
                  <StatHelpText>在所有測試中的比例</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {/* 人格描述 */}
        <Card>
          <CardHeader>
            <Heading size="md">人格描述</Heading>
          </CardHeader>
          <CardBody>
            <Text fontSize="lg" lineHeight="tall">
              {personalityData.description}
            </Text>
          </CardBody>
        </Card>

        {/* 榮格功能偏好 */}
        <Card>
          <CardHeader>
            <Heading size="md">榮格功能偏好</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontWeight="bold" color="purple.500">主導功能</Text>
                <Text>{personalityData.jungianFunctionalPreference.dominant}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold" color="blue.500">輔助功能</Text>
                <Text>{personalityData.jungianFunctionalPreference.auxiliary}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold" color="green.500">第三功能</Text>
                <Text>{personalityData.jungianFunctionalPreference.tertiary}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold" color="red.500">劣勢功能</Text>
                <Text>{personalityData.jungianFunctionalPreference.inferior}</Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* 一般特徵 */}
        <Card>
          <CardHeader>
            <Heading size="md">一般特徵</Heading>
          </CardHeader>
          <CardBody>
            <List spacing={2}>
              {personalityData.generalTraits.map((trait: string, index: number) => (
                <ListItem key={index}>
                  <ListIcon as={FiCheck} color="green.500" />
                  {trait}
                </ListItem>
              ))}
            </List>
          </CardBody>
        </Card>

        {/* 優勢與天賦 */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Card>
            <CardHeader>
              <Heading size="md">優勢</Heading>
            </CardHeader>
            <CardBody>
              <List spacing={2}>
                {personalityData.strengths.map((strength: string, index: number) => (
                  <ListItem key={index}>
                    <ListIcon as={FiCheck} color="green.500" />
                    {strength}
                  </ListItem>
                ))}
              </List>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">天賦</Heading>
            </CardHeader>
            <CardBody>
              <List spacing={2}>
                {personalityData.gifts.map((gift: string, index: number) => (
                  <ListItem key={index}>
                    <ListIcon as={FiCheck} color="blue.500" />
                    {gift}
                  </ListItem>
                ))}
              </List>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* 關係優勢與弱點 */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Card>
            <CardHeader>
              <Heading size="md">關係優勢</Heading>
            </CardHeader>
            <CardBody>
              <List spacing={2}>
                {personalityData.relationshipStrengths.map((strength: string, index: number) => (
                  <ListItem key={index}>
                    <ListIcon as={FiCheck} color="green.500" />
                    {strength}
                  </ListItem>
                ))}
              </List>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">關係弱點</Heading>
            </CardHeader>
            <CardBody>
              <List spacing={2}>
                {personalityData.relationshipWeaknesses.map((weakness: string, index: number) => (
                  <ListItem key={index}>
                    <ListIcon as={FiCheck} color="orange.500" />
                    {weakness}
                  </ListItem>
                ))}
              </List>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* 成功定義 */}
        <Card>
          <CardHeader>
            <Heading size="md">成功定義</Heading>
          </CardHeader>
          <CardBody>
            <Text fontSize="lg">{personalityData.successDefinition}</Text>
          </CardBody>
        </Card>

        {/* 潛在問題領域 */}
        <Card>
          <CardHeader>
            <Heading size="md">潛在問題領域</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <List spacing={2}>
                {personalityData.potentialProblemAreas.map((problem: string, index: number) => (
                  <ListItem key={index}>
                    <ListIcon as={FiCheck} color="orange.500" />
                    {problem}
                  </ListItem>
                ))}
              </List>
              <Divider />
              <Box>
                <Text fontWeight="bold" mb={2}>問題解釋：</Text>
                <Text>{personalityData.explanationOfProblems}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2}>解決方案：</Text>
                <Text>{personalityData.solutions}</Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* 生活建議 */}
        <Card>
          <CardHeader>
            <Heading size="md">快樂生活的建議</Heading>
          </CardHeader>
          <CardBody>
            <Text fontSize="lg" mb={4}>{personalityData.livingHappilyTips}</Text>

            <Divider my={4} />

            <Heading size="sm" mb={3}>十條生活法則：</Heading>
            <List spacing={2}>
              {personalityData.tenRulesToLive.map((rule: string, index: number) => (
                <ListItem key={index}>
                  <ListIcon as={FiCheck} color="purple.500" />
                  {rule}
                </ListItem>
              ))}
            </List>
          </CardBody>
        </Card>

        {/* 建議 */}
        {personalityData.suggestions && personalityData.suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <Heading size="md">額外建議</Heading>
            </CardHeader>
            <CardBody>
              <List spacing={2}>
                {personalityData.suggestions.map((suggestion: string, index: number) => (
                  <ListItem key={index}>
                    <ListIcon as={FiCheck} color="blue.500" />
                    {suggestion}
                  </ListItem>
                ))}
              </List>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Container>
  );
}