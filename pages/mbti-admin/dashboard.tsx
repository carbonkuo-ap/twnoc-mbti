import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
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
  Input,
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
import Image from 'next/image';
import { Highlight } from '@chakra-ui/react';
import dayjs from 'dayjs';
import { personalityTypeDescriptions } from '../../data/personality-descriptions';
import { personalityClasses } from '../../data/personality-classes';
import { isAuthenticated, logoutAdmin, getAdminSession, AdminUser } from '../../lib/auth';
import {
  getAllSavedTestResult,
  TestResult,
  getPersonalityClassGroupByTestScores,
  getPersonalityClassGroupByType
} from '../../lib/personality-test';
import { decryptData } from '../../lib/encryption';
import {
  getAllTestResultsFromFirebase,
  subscribeToTestResults,
  FirebaseTestResult,
  isFirebaseConnected,
  getAllOTPUsageStats,
  deleteTestResultFromFirebase
} from '../../lib/firebase';
import {
  generateOTPToken,
  saveOTPToken,
  getAllOTPTokens,
  deleteOTPToken,
  getOTPStatistics,
  generateShareableOTPUrl,
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
  const [newOtpSubjectName, setNewOtpSubjectName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [firebaseTests, setFirebaseTests] = useState<FirebaseTestResult[]>([]);
  const [otpUsageStats, setOtpUsageStats] = useState<{ [token: string]: number }>({});
  const [selectedPersonalityType, setSelectedPersonalityType] = useState<string>('');
  const [selectedTestScores, setSelectedTestScores] = useState<string[]>([]);
  const router = useRouter();
  const toast = useToast();
  const { isOpen: isOtpModalOpen, onOpen: onOtpModalOpen, onClose: onOtpModalClose } = useDisclosure();
  const { isOpen: isImportModalOpen, onOpen: onImportModalOpen, onClose: onImportModalClose } = useDisclosure();
  const { isOpen: isReportModalOpen, onOpen: onReportModalOpen, onClose: onReportModalClose } = useDisclosure();

  useEffect(() => {
    // 檢查認證狀態
    const checkAuth = async () => {
      if (!(await isAuthenticated())) {
        router.push('/mbti-admin');
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

      // 並行載入資料以減少載入時間
      const [firebaseResults] = await Promise.all([
        getAllTestResultsFromFirebase(),
        loadOTPData() // 並行載入 OTP 資料
      ]);

      const processedStats = processTestResults(firebaseResults);
      setStats(processedStats);
    } catch (error) {
      console.error('載入儀表板資料失敗:', error);
      setError('載入資料時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOTPData = async () => {
    try {
      // 獲取合併後的 OTP tokens（包含 Firebase 使用狀態和已過期的 tokens）
      const tokens = await getAllOTPTokens(true); // includeExpired = true
      setOtpTokens(tokens);

      // 重新計算統計，基於合併後的資料
      const now = Date.now();
      const stats = {
        total: tokens.length,
        active: tokens.filter(t => t.expiresAt > now && !t.usedAt).length,
        used: tokens.filter(t => t.usedAt).length,
        expired: tokens.filter(t => t.expiresAt <= now).length
      };
      setOtpStats(stats);

      // 獲取 Firebase 使用統計
      try {
        const usageStats = await getAllOTPUsageStats();
        setOtpUsageStats(usageStats);
      } catch (error) {
        console.warn('獲取 Firebase 使用統計失敗:', error);
      }
    } catch (error) {
      console.error('載入 OTP 資料失敗:', error);
    }
  };

  const handleCreateOTP = async () => {
    try {
      // 檢查 Firebase 連接
      const { isFirebaseConnected } = await import('../../lib/firebase');
      if (!isFirebaseConnected()) {
        throw new Error('Firebase 未初始化，請檢查環境配置');
      }

      const token = generateOTPToken({
        expirationDays: newOtpDays
      });

      if (newOtpDescription.trim() || newOtpSubjectName.trim()) {
        token.metadata = {
          ...token.metadata,
          description: newOtpDescription.trim(),
          subjectName: newOtpSubjectName.trim()
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
      setNewOtpSubjectName('');
      onOtpModalClose();
    } catch (error) {
      console.error('創建 OTP Token 失敗:', error);

      let errorMessage = '無法創建 OTP Token';
      if (error instanceof Error) {
        if (error.message.includes('Firebase')) {
          errorMessage = 'Firebase 連接失敗，請檢查網路連接和配置';
        } else if (error.message.includes('Permission denied')) {
          errorMessage = 'Firebase 權限不足，請檢查安全規則';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: '創建失敗',
        description: errorMessage,
        status: 'error',
        duration: 5000,
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
    // 過期的 tokens 現在由 Firebase 查詢自動處理
    toast({
      title: '提示',
      description: '過期的 OTP Token 已由系統自動處理',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    loadOTPData(); // 重新載入數據以刷新顯示
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

  const handlePersonalityTypeClick = (personalityType: string, testScores?: string[]) => {
    setSelectedPersonalityType(personalityType);
    setSelectedTestScores(testScores || []);
    onReportModalOpen();
  };

  const handleDeleteTestResult = async (testId: string) => {
    if (!confirm('確定要刪除這筆測試記錄嗎？此操作無法復原。')) {
      return;
    }

    try {
      const success = await deleteTestResultFromFirebase(testId);
      if (success) {
        toast({
          title: '測試記錄已刪除',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // 重新載入資料
        loadDashboardData();
      } else {
        toast({
          title: '刪除失敗',
          description: '無法刪除測試記錄',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('刪除測試記錄失敗:', error);
      toast({
        title: '刪除失敗',
        description: '刪除過程中發生錯誤',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
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

  const processTestResults = (firebaseResults: FirebaseTestResult[]): TestStats => {
    // Firebase-only 架構，只處理 Firebase 資料
    const today = dayjs().startOf('day');
    const todayTests = firebaseResults.filter(test =>
      dayjs(test.timestamp).isAfter(today)
    ).length;

    // 統計最受歡迎的類型
    const typeCount: Record<string, number> = {};
    firebaseResults.forEach(test => {
      const personalityClassGroup = getPersonalityClassGroupByTestScores(test.testScores);
      const type = personalityClassGroup.type;
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const popularType = Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    // 最近的測試（最多顯示20個）
    const recentTests = [...firebaseResults]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return {
      totalTests: firebaseResults.length,
      todayTests,
      popularType,
      recentTests,
      firebaseTests: firebaseResults,
      localTests: [] // Firebase-only，沒有本地資料
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
    router.push('/mbti-admin');
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

  if (isLoading && !stats) {
    return (
      <Container maxW="6xl" py={8}>
        <Flex justify="center" align="center" h="50vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="primary.500" />
            <Text>載入儀表板資料中...</Text>
          </VStack>
        </Flex>
      </Container>
    );
  }


  return (
    <>
      <Head>
        <title>MBTI 管理後台 - 儀表板</title>
        <meta name="description" content="MBTI 測試管理後台儀表板" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/favicon.ico`} />
      </Head>
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
                              // Firebase-only 架構，所有測試都來自 Firebase
                              const firebaseTest = test as FirebaseTestResult;
                              const testOtpToken = firebaseTest?.otpToken;

                              return (
                                <Tr key={index}>
                                  <Td>{formatDate(test.timestamp.toString())}</Td>
                                  <Td>
                                    <Badge
                                      colorScheme={getTypeColor(personalityClassGroup.type)}
                                      cursor="pointer"
                                      onClick={() => handlePersonalityTypeClick(personalityClassGroup.type, test.testScores)}
                                      _hover={{ transform: 'scale(1.05)' }}
                                    >
                                      {personalityClassGroup.type}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <Badge
                                      colorScheme="green"
                                      size="sm"
                                    >
                                      Firebase
                                    </Badge>
                                  </Td>
                                  <Td>
                                    {testOtpToken && testOtpToken.trim() !== '' ? (
                                      <VStack align="start" spacing={1}>
                                        <Text fontSize="xs" fontFamily="mono">
                                          {testOtpToken.substring(0, 8)}...
                                        </Text>
                                        <Badge size="xs" colorScheme="orange">
                                          使用 {otpUsageStats[testOtpToken] || 1} 次
                                        </Badge>
                                      </VStack>
                                    ) : (
                                      <Text fontSize="xs" color="gray.500">
                                        無授權
                                      </Text>
                                    )}
                                  </Td>
                                  <Td>
                                    <HStack spacing={2}>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handlePersonalityTypeClick(personalityClassGroup.type, test.testScores)}
                                      >
                                        查看報告
                                      </Button>
                                      <IconButton
                                        icon={<Icon as={FiTrash2} />}
                                        aria-label="刪除記錄"
                                        size="sm"
                                        colorScheme="red"
                                        variant="outline"
                                        onClick={() => handleDeleteTestResult(firebaseTest.id || '')}
                                      />
                                    </HStack>
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
                                <Th>受試者</Th>
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
                                  <Td>
                                    <Text fontSize="sm">
                                      {token.metadata?.subjectName || '-'}
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
                  <FormLabel>受試者姓名</FormLabel>
                  <Input
                    value={newOtpSubjectName}
                    onChange={(e) => setNewOtpSubjectName(e.target.value)}
                    placeholder="請輸入受試者姓名"
                  />
                </FormControl>

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
                    placeholder="例如：心理測試、員工評估等"
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
          <ModalContent maxW="90vw" maxH="90vh">
            <ModalHeader>
              <HStack spacing={3}>
                <Badge colorScheme={getTypeColor(selectedPersonalityType)} fontSize="lg" p={2}>
                  {selectedPersonalityType}
                </Badge>
                <Text fontSize="xl">完整測試報告</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody overflowY="auto">
              {selectedPersonalityType && (() => {
                const personalityClassGroup = getPersonalityClassGroupByType(selectedPersonalityType);
                return (
                  <VStack align="stretch" spacing={6}>
                    {/* 性格類型標題和圖片 */}
                    <Flex direction="column" align="center">
                      <Heading as="h1" textAlign="center" mb={4}>
                        <Highlight
                          query={personalityClassGroup.type}
                          styles={{ color: "primary.500" }}
                        >
                          {`${personalityClassGroup.type}`}
                        </Highlight>
                      </Heading>
                      <Image
                        alt="illustration"
                        src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/mbti/${personalityClassGroup.type.toUpperCase()}.png`}
                        width={150}
                        height={150}
                      />
                      <Heading as="h2" fontSize="xl" textAlign="center" mt={4} mb={4}>
                        {personalityClassGroup.epithet}
                      </Heading>
                    </Flex>

                    {/* 分數統計 */}
                    {selectedTestScores.length > 0 && (
                      <Box>
                        <Heading size="md" mb={3} color="blue.600">📊 分數統計</Heading>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                          {personalityClasses.map((personalityClass, index) => {
                            const statsColorScheme = ['red', 'blue', 'yellow', 'purple', 'orange', 'green', 'pink', 'teal'];
                            const testScoresFiltered = selectedTestScores.filter(
                              (score) => score === personalityClass.type
                            );
                            const percentage = ((testScoresFiltered.length / selectedTestScores.length) * 100)
                              .toFixed(2)
                              .replace(/[.,]0+$/, "");

                            return (
                              <Flex
                                key={index}
                                p={3}
                                rounded="md"
                                direction="column"
                                bg={`${statsColorScheme[index]}.500`}
                                color="white"
                              >
                                <Text fontWeight="semibold" fontSize="sm" mb={2}>
                                  {personalityClass.description}
                                </Text>
                                <Flex justify="space-between" align="center">
                                  <Text fontWeight="bold" fontSize="lg">
                                    {percentage}%
                                  </Text>
                                  <Text fontSize="sm">
                                    ({testScoresFiltered.length})
                                  </Text>
                                </Flex>
                              </Flex>
                            );
                          })}
                        </SimpleGrid>
                      </Box>
                    )}

                    {/* 性格描述 */}
                    <Box>
                      <Heading size="md" mb={3} color="blue.600">📖 性格描述</Heading>
                      {personalityClassGroup.description
                        .split(/\.\n+/g)
                        .map((description) =>
                          description.endsWith(".") ? description : `${description}.`
                        )
                        .map((description, index) => (
                          <Text key={index} textAlign="justify" mb={2}>
                            {description}
                          </Text>
                        ))}
                    </Box>

                    {/* 榮格功能偏好排序 */}
                    <Box>
                      <Heading size="md" mb={3} color="purple.600">🧠 榮格功能偏好排序</Heading>
                      <Table size="sm">
                        <Tbody>
                          <Tr>
                            <Th>主導功能</Th>
                            <Td>{personalityClassGroup.jungianFunctionalPreference.dominant}</Td>
                          </Tr>
                          <Tr>
                            <Th>輔助功能</Th>
                            <Td>{personalityClassGroup.jungianFunctionalPreference.auxiliary}</Td>
                          </Tr>
                          <Tr>
                            <Th>第三功能</Th>
                            <Td>{personalityClassGroup.jungianFunctionalPreference.tertiary}</Td>
                          </Tr>
                          <Tr>
                            <Th>劣勢功能</Th>
                            <Td>{personalityClassGroup.jungianFunctionalPreference.inferior}</Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </Box>

                    {/* 總體特質 */}
                    <Box>
                      <Heading size="md" mb={3} color="green.600">💫 {personalityClassGroup.type} 總體特質</Heading>
                      <UnorderedList spacing={2}>
                        {personalityClassGroup.generalTraits.map((trait, index) => (
                          <ListItem key={index} textAlign="justify">{trait}</ListItem>
                        ))}
                      </UnorderedList>
                    </Box>

                    {/* 人際關係優缺點 */}
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                      <Box>
                        <Heading size="md" mb={3} color="teal.600">👥 人際關係優點</Heading>
                        <UnorderedList spacing={2}>
                          {personalityClassGroup.relationshipStrengths.map((strength, index) => (
                            <ListItem key={index} textAlign="justify">{strength}</ListItem>
                          ))}
                        </UnorderedList>
                      </Box>

                      <Box>
                        <Heading size="md" mb={3} color="orange.600">⚠️ 人際關係不足</Heading>
                        <UnorderedList spacing={2}>
                          {personalityClassGroup.relationshipWeaknesses.map((weakness, index) => (
                            <ListItem key={index} textAlign="justify">{weakness}</ListItem>
                          ))}
                        </UnorderedList>
                      </Box>
                    </SimpleGrid>

                    {/* 成功定義 */}
                    <Box>
                      <Heading size="md" mb={3} color="yellow.600">🎯 成功定義</Heading>
                      {personalityClassGroup.successDefinition
                        .split(/\.\n+/g)
                        .map((successDefinition) =>
                          successDefinition.endsWith(".")
                            ? successDefinition
                            : `${successDefinition}.`
                        )
                        .map((successDefinition, index) => (
                          <Text key={index} textAlign="justify" mb={2}>
                            {successDefinition}
                          </Text>
                        ))}
                    </Box>

                    {/* 優勢和特殊才能 */}
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                      <Box>
                        <Heading size="md" mb={3} color="green.600">💪 優勢</Heading>
                        <UnorderedList spacing={2}>
                          {personalityClassGroup.strengths.map((strength, index) => (
                            <ListItem key={index} textAlign="justify">{strength}</ListItem>
                          ))}
                        </UnorderedList>
                      </Box>

                      <Box>
                        <Heading size="md" mb={3} color="purple.600">✨ 特殊才能</Heading>
                        <UnorderedList spacing={2}>
                          {personalityClassGroup.gifts.map((gift, index) => (
                            <ListItem key={index} textAlign="justify">{gift}</ListItem>
                          ))}
                        </UnorderedList>
                      </Box>
                    </SimpleGrid>

                    {/* 其他詳細內容可以繼續添加 */}
                  </VStack>
                );
              })()}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onReportModalClose}>關閉</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
      </Container>
    </>
  );
}