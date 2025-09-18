import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Flex,
  Icon,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { FiUsers, FiActivity, FiBarChart, FiLogOut } from 'react-icons/fi';
import dayjs from 'dayjs';
import { isAuthenticated, logoutAdmin, getAdminSession, AdminUser } from '../../lib/auth';
import {
  getAllSavedTestResult,
  TestResult,
  getPersonalityClassGroupByTestScores
} from '../../lib/personality-test';
import { decryptDataWithFallback as decryptData } from '../../lib/encryption';

interface TestStats {
  totalTests: number;
  todayTests: number;
  popularType: string;
  recentTests: TestResult[];
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [error, setError] = useState('');
  const [session, setSession] = useState<AdminUser | null>(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    // 檢查認證狀態
    const checkAuth = async () => {
      if (!(await isAuthenticated())) {
        router.push('./index');
        return;
      }
      loadDashboardData();
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // loadDashboardData 不需要加入依賴，因為它不使用任何狀態或 props

  useEffect(() => {
    const fetchSession = async () => {
      const currentSession = await getAdminSession();
      setSession(currentSession);
    };
    fetchSession();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // 獲取所有測試結果
      const result = await getAllSavedTestResult();

      result.match({
        Ok: (option) => {
          option.match({
            Some: (testResults) => {
              const processedStats = processTestResults(testResults);
              setStats(processedStats);
            },
            None: () => {
              setStats({
                totalTests: 0,
                todayTests: 0,
                popularType: 'N/A',
                recentTests: []
              });
            }
          });
        },
        Error: (err) => {
          console.error('載入測試資料失敗:', err);
          setError('無法載入測試資料');
        }
      });
    } catch (error) {
      console.error('載入儀表板資料失敗:', error);
      setError('載入資料時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const processTestResults = (testResults: TestResult[]): TestStats => {
    const today = dayjs().startOf('day');
    const todayTests = testResults.filter(test =>
      dayjs(test.timestamp).isAfter(today)
    ).length;

    // 統計最受歡迎的類型
    const typeCount: Record<string, number> = {};
    testResults.forEach(test => {
      const personalityClassGroup = getPersonalityClassGroupByTestScores(test.testScores);
      const type = personalityClassGroup.type;
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const popularType = Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    // 最近的測試（最多顯示10個）
    const recentTests = [...testResults]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      totalTests: testResults.length,
      todayTests,
      popularType,
      recentTests
    };
  };

  const handleLogout = () => {
    logoutAdmin();
    toast({
      title: '已登出',
      description: '您已成功登出管理後台',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    router.push('./index');
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY/MM/DD HH:mm');
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
      <Container maxW="6xl" py={8}>
        <Flex justify="center" align="center" h="50vh">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text>載入中...</Text>
          </VStack>
        </Flex>
      </Container>
    );
  }


  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* 頁面標題 */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="xl">MBTI 管理後台</Heading>
            <Text color="gray.600">
              歡迎回來，{session?.username}
            </Text>
          </VStack>
          <Button
            leftIcon={<Icon as={FiLogOut} />}
            onClick={handleLogout}
            variant="outline"
          >
            登出
          </Button>
        </Flex>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {stats && (
          <>
            {/* 統計卡片 */}
            <Grid templateColumns="repeat(auto-fit, minmax(240px, 1fr))" gap={6}>
              <GridItem>
                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>
                        <HStack>
                          <Icon as={FiUsers} />
                          <Text>總測試次數</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber>{stats.totalTests}</StatNumber>
                      <StatHelpText>累計測試總數</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>

              <GridItem>
                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>
                        <HStack>
                          <Icon as={FiActivity} />
                          <Text>今日測試</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber>{stats.todayTests}</StatNumber>
                      <StatHelpText>今天新增的測試</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>

              <GridItem>
                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>
                        <HStack>
                          <Icon as={FiBarChart} />
                          <Text>最受歡迎類型</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber>
                        <Badge colorScheme={getTypeColor(stats.popularType)} size="lg">
                          {stats.popularType}
                        </Badge>
                      </StatNumber>
                      <StatHelpText>出現次數最多的性格類型</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>

            {/* 最近的測試記錄 */}
            <Card>
              <CardHeader>
                <Heading size="md">最近的測試記錄</Heading>
              </CardHeader>
              <CardBody>
                {stats.recentTests.length > 0 ? (
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>測試時間</Th>
                        <Th>性格類型</Th>
                        <Th>維度分數</Th>
                        <Th>測試時長</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {stats.recentTests.map((test, index) => {
                        const personalityClassGroup = getPersonalityClassGroupByTestScores(test.testScores);
                        return (
                          <Tr key={index}>
                            <Td>{formatDate(test.timestamp.toString())}</Td>
                            <Td>
                              <Badge colorScheme={getTypeColor(personalityClassGroup.type)}>
                                {personalityClassGroup.type}
                              </Badge>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                測試答案: {test.testAnswers.join(', ')}
                              </Text>
                            </Td>
                            <Td>
                              N/A
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                ) : (
                  <Text color="gray.500" textAlign="center" py={8}>
                    暫無測試記錄
                  </Text>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </VStack>
    </Container>
  );
}