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
  GridItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  useClipboard,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  UnorderedList,
  ListItem,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { FiUsers, FiActivity, FiBarChart, FiLogOut, FiKey, FiCopy, FiTrash2, FiCode, FiDownload, FiUpload } from 'react-icons/fi';
import dayjs from 'dayjs';
import { personalityTypeDescriptions } from '../../data/personality-descriptions';
import { isAuthenticated, logoutAdmin, getAdminSession, AdminUser } from '../../lib/auth';
import {
  getAllSavedTestResult,
  TestResult,
  getPersonalityClassGroupByTestScores
} from '../../lib/personality-test';
import { decryptData } from '../../lib/encryption';
import {
  getAllTestResultsFromFirebase,
  subscribeToTestResults,
  FirebaseTestResult,
  isFirebaseConnected,
  getAllOTPUsageStats
} from '../../lib/firebase';
import {
  generateOTPToken,
  saveOTPToken,
  getAllOTPTokens,
  deleteOTPToken,
  getOTPStatistics,
  generateShareableOTPUrl,
  cleanupExpiredOTPTokens,
  OTPToken
} from '../../lib/otp';

interface TestStats {
  totalTests: number;
  todayTests: number;
  popularType: string;
  recentTests: (TestResult | FirebaseTestResult)[];
  firebaseTests?: FirebaseTestResult[];
  localTests?: TestResult[];
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [error, setError] = useState('');
  const [session, setSession] = useState<AdminUser | null>(null);
  const [otpTokens, setOtpTokens] = useState<OTPToken[]>([]);
  const [otpStats, setOtpStats] = useState({ total: 0, active: 0, used: 0, expired: 0 });
  const [newOtpDays, setNewOtpDays] = useState(7);
  const [newOtpDescription, setNewOtpDescription] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [firebaseTests, setFirebaseTests] = useState<FirebaseTestResult[]>([]);
  const [otpUsageStats, setOtpUsageStats] = useState<{ [token: string]: number }>({});
  const [selectedPersonalityType, setSelectedPersonalityType] = useState<string>('');
  const router = useRouter();
  const toast = useToast();
  const { isOpen: isOtpModalOpen, onOpen: onOtpModalOpen, onClose: onOtpModalClose } = useDisclosure();
  const { isOpen: isImportModalOpen, onOpen: onImportModalOpen, onClose: onImportModalClose } = useDisclosure();
  const { isOpen: isReportModalOpen, onOpen: onReportModalOpen, onClose: onReportModalClose } = useDisclosure();

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

  // Firebase 資料監聽
  useEffect(() => {
    setFirebaseConnected(isFirebaseConnected());

    if (isFirebaseConnected()) {
      // 訂閱 Firebase 即時更新
      const unsubscribe = subscribeToTestResults((results) => {
        setFirebaseTests(results);
      });

      // 載入 OTP 使用統計
      getAllOTPUsageStats().then(setOtpUsageStats);

      return unsubscribe;
    }
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

      // 載入 OTP 資料
      loadOTPData();
    } catch (error) {
      console.error('載入儀表板資料失敗:', error);
      setError('載入資料時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOTPData = async () => {
    try {
      const tokens = await getAllOTPTokens();
      const stats = getOTPStatistics();
      setOtpTokens(tokens);
      setOtpStats(stats);
    } catch (error) {
      console.error('載入 OTP 資料失敗:', error);
    }
  };

  const handleCreateOTP = async () => {
    try {
      const token = generateOTPToken({
        expirationDays: newOtpDays
      });

      if (newOtpDescription.trim()) {
        token.metadata = {
          ...token.metadata,
          description: newOtpDescription.trim()
        };
      }

      await saveOTPToken(token);
      await loadOTPData();

      toast({
        title: 'OTP Token 創建成功',
        description: `有效期 ${newOtpDays} 天`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // 重置表單
      setNewOtpDays(7);
      setNewOtpDescription('');
      onOtpModalClose();
    } catch (error) {
      console.error('創建 OTP Token 失敗:', error);
      toast({
        title: '創建失敗',
        description: '無法創建 OTP Token',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteOTP = async (token: string) => {
    try {
      const success = await deleteOTPToken(token);
      if (success) {
        await loadOTPData();
        toast({
          title: 'OTP Token 已刪除',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: '刪除失敗',
          description: '找不到指定的 OTP Token',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('刪除 OTP Token 失敗:', error);
      toast({
        title: '刪除失敗',
        description: '無法刪除 OTP Token',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCleanupExpired = () => {
    try {
      const cleanedCount = cleanupExpiredOTPTokens();
      loadOTPData();
      toast({
        title: '清理完成',
        description: `已清理 ${cleanedCount} 個過期的 OTP Token`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('清理過期 OTP Token 失敗:', error);
      toast({
        title: '清理失敗',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const result = await getAllSavedTestResult();

      result.match({
        Ok: (option) => {
          option.match({
            Some: (testResults) => {
              const exportData = {
                timestamp: Date.now(),
                version: '1.0',
                data: testResults,
                exportedBy: session?.username || 'admin'
              };

              const dataStr = JSON.stringify(exportData, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });

              const url = window.URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `mbti-test-results-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);

              toast({
                title: '匯出成功',
                description: `已匯出 ${testResults.length} 筆測試記錄`,
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
            },
            None: () => {
              toast({
                title: '沒有資料可匯出',
                status: 'info',
                duration: 3000,
                isClosable: true,
              });
            }
          });
        },
        Error: (err) => {
          console.error('匯出失敗:', err);
          toast({
            title: '匯出失敗',
            description: '無法讀取測試資料',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      });
    } catch (error) {
      console.error('匯出過程發生錯誤:', error);
      toast({
        title: '匯出失敗',
        description: '匯出過程發生錯誤',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      toast({
        title: '檔案格式錯誤',
        description: '請選擇 JSON 格式的檔案',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);

        if (!importData.data || !Array.isArray(importData.data)) {
          throw new Error('無效的資料格式');
        }

        // 這裡可以添加資料驗證邏輯
        const testResults = importData.data;

        toast({
          title: '匯入成功',
          description: `準備匯入 ${testResults.length} 筆記錄`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // 重新載入資料
        loadDashboardData();
        onImportModalClose();
      } catch (error) {
        console.error('匯入失敗:', error);
        toast({
          title: '匯入失敗',
          description: '檔案格式無效或資料損壞',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsImporting(false);
        // 清除檔案輸入
        if (event.target) {
          event.target.value = '';
        }
      }
    };

    reader.readAsText(file);
  };

  const handlePersonalityTypeClick = (personalityType: string) => {
    setSelectedPersonalityType(personalityType);
    onReportModalOpen();
  };

  const CopyUrlButton = ({ token }: { token: string }) => {
    const url = generateShareableOTPUrl(token);
    const { onCopy, hasCopied } = useClipboard(url);

    return (
      <IconButton
        icon={<Icon as={FiCopy} />}
        aria-label="複製分享連結"
        size="sm"
        onClick={onCopy}
        colorScheme={hasCopied ? 'green' : 'blue'}
        variant="outline"
      />
    );
  };

  const processTestResults = (localTests: TestResult[]): TestStats => {
    // 合併本地和 Firebase 資料
    const allTests = [...localTests, ...firebaseTests];

    // 去除重複的測試（基於時間戳）
    const uniqueTests = allTests.filter((test, index, self) =>
      index === self.findIndex(t => t.timestamp === test.timestamp)
    );

    const today = dayjs().startOf('day');
    const todayTests = uniqueTests.filter(test =>
      dayjs(test.timestamp).isAfter(today)
    ).length;

    // 統計最受歡迎的類型
    const typeCount: Record<string, number> = {};
    uniqueTests.forEach(test => {
      const personalityClassGroup = getPersonalityClassGroupByTestScores(test.testScores);
      const type = personalityClassGroup.type;
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const popularType = Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    // 最近的測試（最多顯示20個）
    const recentTests = [...uniqueTests]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return {
      totalTests: uniqueTests.length,
      todayTests,
      popularType,
      recentTests,
      firebaseTests,
      localTests
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

  const formatDate = (timestamp: string | number) => {
    return dayjs(Number(timestamp)).format('YYYY/MM/DD HH:mm');
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
                        <Badge
                          colorScheme={getTypeColor(stats.popularType)}
                          size="lg"
                          cursor="pointer"
                          onClick={() => handlePersonalityTypeClick(stats.popularType)}
                          _hover={{ transform: 'scale(1.05)' }}
                        >
                          {stats.popularType}
                        </Badge>
                      </StatNumber>
                      <StatHelpText>出現次數最多的性格類型</StatHelpText>
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
                          <Icon as={FiKey} />
                          <Text>活躍 OTP</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber>{otpStats.active}</StatNumber>
                      <StatHelpText>可用的授權Token</StatHelpText>
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
                          <Text>Firebase 狀態</Text>
                        </HStack>
                      </StatLabel>
                      <StatNumber>
                        <Badge colorScheme={firebaseConnected ? 'green' : 'red'}>
                          {firebaseConnected ? '已連接' : '未連接'}
                        </Badge>
                      </StatNumber>
                      <StatHelpText>
                        {firebaseConnected ? `Firebase 測試: ${firebaseTests.length}` : '跨設備同步離線'}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>

            {/* 主要內容區域 - 使用 Tabs */}
            <Tabs>
              <TabList>
                <Tab>測試記錄</Tab>
                <Tab>OTP 管理</Tab>
              </TabList>

              <TabPanels>
                {/* 測試記錄標籤 */}
                <TabPanel>
                  <Card>
                    <CardHeader>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">最近的測試記錄</Heading>
                        <HStack spacing={2}>
                          <Button
                            leftIcon={<FiDownload />}
                            size="sm"
                            variant="outline"
                            onClick={handleExportData}
                            isLoading={isExporting}
                            loadingText="匯出中"
                          >
                            匯出資料
                          </Button>
                          <Button
                            leftIcon={<FiUpload />}
                            size="sm"
                            variant="outline"
                            onClick={onImportModalOpen}
                          >
                            匯入資料
                          </Button>
                        </HStack>
                      </Flex>
                    </CardHeader>
                    <CardBody>
                      {stats.recentTests.length > 0 ? (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>測試時間</Th>
                              <Th>性格類型</Th>
                              <Th>來源</Th>
                              <Th>OTP Token</Th>
                              <Th>操作</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {stats.recentTests.map((test, index) => {
                              const personalityClassGroup = getPersonalityClassGroupByTestScores(test.testScores);
                              const isFirebaseTest = 'otpToken' in test;
                              const firebaseTest = isFirebaseTest ? test as FirebaseTestResult : null;

                              return (
                                <Tr key={index}>
                                  <Td>{formatDate(test.timestamp.toString())}</Td>
                                  <Td>
                                    <Badge
                                      colorScheme={getTypeColor(personalityClassGroup.type)}
                                      cursor="pointer"
                                      onClick={() => handlePersonalityTypeClick(personalityClassGroup.type)}
                                      _hover={{ transform: 'scale(1.05)' }}
                                    >
                                      {personalityClassGroup.type}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <Badge
                                      colorScheme={isFirebaseTest ? 'green' : 'blue'}
                                      size="sm"
                                    >
                                      {isFirebaseTest ? 'Firebase' : '本地'}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    {firebaseTest?.otpToken ? (
                                      <VStack align="start" spacing={1}>
                                        <Text fontSize="xs" fontFamily="mono">
                                          {firebaseTest.otpToken.substring(0, 8)}...
                                        </Text>
                                        <Badge size="xs" colorScheme="orange">
                                          使用 {otpUsageStats[firebaseTest.otpToken] || 1} 次
                                        </Badge>
                                      </VStack>
                                    ) : (
                                      <Text fontSize="xs" color="gray.500">
                                        無授權
                                      </Text>
                                    )}
                                  </Td>
                                  <Td>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePersonalityTypeClick(personalityClassGroup.type)}
                                    >
                                      查看報告
                                    </Button>
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
                </TabPanel>

                {/* OTP 管理標籤 */}
                <TabPanel>
                  <VStack spacing={6}>
                    {/* OTP 統計 */}
                    <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} w="full">
                      <Card>
                        <CardBody>
                          <Stat>
                            <StatLabel>總計</StatLabel>
                            <StatNumber>{otpStats.total}</StatNumber>
                          </Stat>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody>
                          <Stat>
                            <StatLabel>活躍</StatLabel>
                            <StatNumber color="green.500">{otpStats.active}</StatNumber>
                          </Stat>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody>
                          <Stat>
                            <StatLabel>已使用</StatLabel>
                            <StatNumber color="blue.500">{otpStats.used}</StatNumber>
                          </Stat>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardBody>
                          <Stat>
                            <StatLabel>已過期</StatLabel>
                            <StatNumber color="red.500">{otpStats.expired}</StatNumber>
                          </Stat>
                        </CardBody>
                      </Card>
                    </Grid>

                    {/* OTP 操作按鈕 */}
                    <HStack spacing={4}>
                      <Button
                        leftIcon={<Icon as={FiKey} />}
                        colorScheme="blue"
                        onClick={onOtpModalOpen}
                      >
                        建立新 OTP
                      </Button>
                      <Button
                        leftIcon={<Icon as={FiTrash2} />}
                        variant="outline"
                        onClick={handleCleanupExpired}
                      >
                        清理過期
                      </Button>
                    </HStack>

                    {/* OTP Token 列表 */}
                    <Card w="full">
                      <CardHeader>
                        <Heading size="md">OTP Token 列表</Heading>
                      </CardHeader>
                      <CardBody>
                        {otpTokens.length > 0 ? (
                          <Table variant="simple">
                            <Thead>
                              <Tr>
                                <Th>Token</Th>
                                <Th>建立時間</Th>
                                <Th>過期時間</Th>
                                <Th>狀態</Th>
                                <Th>操作</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {otpTokens.map((token, index) => (
                                <Tr key={index}>
                                  <Td>
                                    <Text fontFamily="mono" fontSize="sm">
                                      {token.token.substring(0, 8)}...
                                    </Text>
                                  </Td>
                                  <Td>{formatDate(token.createdAt)}</Td>
                                  <Td>{formatDate(token.expiresAt)}</Td>
                                  <Td>
                                    <Badge
                                      colorScheme={
                                        token.usedAt
                                          ? 'blue'
                                          : token.expiresAt > Date.now()
                                          ? 'green'
                                          : 'red'
                                      }
                                    >
                                      {token.usedAt
                                        ? '已使用'
                                        : token.expiresAt > Date.now()
                                        ? '活躍'
                                        : '已過期'}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <HStack spacing={2}>
                                      <CopyUrlButton token={token.token} />
                                      <IconButton
                                        icon={<Icon as={FiTrash2} />}
                                        aria-label="刪除"
                                        size="sm"
                                        colorScheme="red"
                                        variant="outline"
                                        onClick={() => handleDeleteOTP(token.token)}
                                      />
                                    </HStack>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        ) : (
                          <Text color="gray.500" textAlign="center" py={8}>
                            暫無 OTP Token
                          </Text>
                        )}
                      </CardBody>
                    </Card>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </>
        )}

        {/* 建立 OTP Modal */}
        <Modal isOpen={isOtpModalOpen} onClose={onOtpModalClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>建立新的 OTP Token</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>有效天數</FormLabel>
                  <NumberInput
                    value={newOtpDays}
                    onChange={(valueString) => setNewOtpDays(parseInt(valueString) || 7)}
                    min={1}
                    max={365}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>描述（選填）</FormLabel>
                  <Textarea
                    value={newOtpDescription}
                    onChange={(e) => setNewOtpDescription(e.target.value)}
                    placeholder="例如：張三的測試授權"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onOtpModalClose}>
                取消
              </Button>
              <Button colorScheme="blue" onClick={handleCreateOTP}>
                建立 OTP
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 匯入資料 Modal */}
        <Modal isOpen={isImportModalOpen} onClose={onImportModalClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>匯入測試資料</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Alert status="info">
                  <AlertIcon />
                  <Text fontSize="sm">
                    請選擇之前匯出的 JSON 格式檔案。匯入的資料將與現有資料合併。
                  </Text>
                </Alert>

                <FormControl>
                  <FormLabel>選擇檔案</FormLabel>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px'
                    }}
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onImportModalClose}>
                取消
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 人格報告 Modal */}
        <Modal isOpen={isReportModalOpen} onClose={onReportModalClose} size="6xl">
          <ModalOverlay />
          <ModalContent maxW="80vw" maxH="90vh">
            <ModalHeader>
              <HStack spacing={3}>
                <Badge colorScheme={getTypeColor(selectedPersonalityType)} fontSize="lg" p={2}>
                  {selectedPersonalityType}
                </Badge>
                <Text fontSize="xl">
                  {personalityTypeDescriptions[selectedPersonalityType]?.name || ''}
                </Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody overflowY="auto">
              {selectedPersonalityType && personalityTypeDescriptions[selectedPersonalityType] && (
                <VStack align="stretch" spacing={6}>
                  <Box>
                    <Heading size="md" mb={3} color="blue.600">📖 性格描述</Heading>
                    <Text fontSize="lg" lineHeight="1.8">
                      {personalityTypeDescriptions[selectedPersonalityType].description}
                    </Text>
                  </Box>

                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    <Box>
                      <Heading size="md" mb={3} color="green.600">💪 主要優點</Heading>
                      <UnorderedList spacing={2}>
                        {personalityTypeDescriptions[selectedPersonalityType].strengths.map((strength, index) => (
                          <ListItem key={index} fontSize="md">{strength}</ListItem>
                        ))}
                      </UnorderedList>
                    </Box>

                    <Box>
                      <Heading size="md" mb={3} color="orange.600">⚠️ 需要改進</Heading>
                      <UnorderedList spacing={2}>
                        {personalityTypeDescriptions[selectedPersonalityType].weaknesses.map((weakness, index) => (
                          <ListItem key={index} fontSize="md">{weakness}</ListItem>
                        ))}
                      </UnorderedList>
                    </Box>
                  </SimpleGrid>

                  <Box>
                    <Heading size="md" mb={3} color="purple.600">💼 適合職業</Heading>
                    <Wrap spacing={2}>
                      {personalityTypeDescriptions[selectedPersonalityType].careers.map((career, index) => (
                        <WrapItem key={index}>
                          <Badge colorScheme="purple" variant="outline" fontSize="sm" p={2}>
                            {career}
                          </Badge>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>

                  <Box>
                    <Heading size="md" mb={3} color="pink.600">❤️ 人際關係建議</Heading>
                    <UnorderedList spacing={2}>
                      {personalityTypeDescriptions[selectedPersonalityType].relationships.map((relationship, index) => (
                        <ListItem key={index} fontSize="md">{relationship}</ListItem>
                      ))}
                    </UnorderedList>
                  </Box>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onReportModalClose}>關閉</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
}