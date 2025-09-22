import React, { useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  ColDef,
  GridReadyEvent,
} from 'ag-grid-community';

// 註冊 AG Grid 社區版模組
ModuleRegistry.registerModules([AllCommunityModule]);
import {
  Badge,
  HStack,
  IconButton,
  Button,
  Text,
  VStack,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
} from '@chakra-ui/react';
import { FiTrash2, FiEye, FiDownload } from 'react-icons/fi';
import { FirebaseTestResult } from '../../lib/firebase';
import { getPersonalityClassGroupByTestScores } from '../../lib/personality-test';
import { OTPToken } from '../../lib/otp';

interface TestResultsGridProps {
  testResults: FirebaseTestResult[];
  otpUsageStats: { [token: string]: number };
  otpTokens: OTPToken[];
  onDeleteTest: (testId: string) => void;
  onViewReport: (personalityType: string, testScores: any[]) => void;
  onExportData?: () => void;
  onImportData?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const TestResultsGrid: React.FC<TestResultsGridProps> = ({
  testResults,
  otpUsageStats,
  otpTokens,
  onDeleteTest,
  onViewReport,
  onExportData,
  onImportData,
}) => {
  const getTypeColor = (type: string) => {
    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'teal', 'pink', 'yellow'];
    return colors[type.charCodeAt(0) % colors.length];
  };

  const formatDate = (timestamp: string | number) => {
    return new Date(Number(timestamp)).toLocaleString('zh-TW');
  };

  // 操作按鈕渲染器
  const ActionCellRenderer = useCallback((props: any) => {
    const test = props.data;
    const personalityClassGroup = getPersonalityClassGroupByTestScores(test.testScores);

    return (
      <HStack spacing={2} h="100%" align="center">
        <Button
          size="sm"
          variant="outline"
          leftIcon={<FiEye />}
          onClick={() => onViewReport(personalityClassGroup.type, test.testScores)}
        >
          查看報告
        </Button>
        <IconButton
          icon={<Icon as={FiTrash2} />}
          aria-label="刪除記錄"
          size="sm"
          colorScheme="red"
          variant="outline"
          onClick={() => onDeleteTest(test.id || '')}
        />
      </HStack>
    );
  }, [onDeleteTest, onViewReport]);

  // 性格類型渲染器
  const PersonalityTypeCellRenderer = useCallback((props: any) => {
    const test = props.data;
    const personalityClassGroup = getPersonalityClassGroupByTestScores(test.testScores);

    return (
      <Badge
        colorScheme={getTypeColor(personalityClassGroup.type)}
        cursor="pointer"
        onClick={() => onViewReport(personalityClassGroup.type, test.testScores)}
        _hover={{ transform: 'scale(1.05)' }}
      >
        {personalityClassGroup.type}
      </Badge>
    );
  }, [onViewReport]);

  // 受試者名稱渲染器
  const SubjectCellRenderer = useCallback((props: any) => {
    const test = props.data;
    const testOtpToken = test?.otpToken;

    if (testOtpToken && testOtpToken.trim() !== '') {
      // 從 otpTokens 中找到對應的 token 並獲取 subjectName
      const matchedToken = otpTokens.find(token => token.token === testOtpToken);
      const subjectName = matchedToken?.metadata?.subjectName;

      if (subjectName) {
        return (
          <Text fontSize="sm" title={subjectName}>
            {subjectName}
          </Text>
        );
      }
    }

    return (
      <Text fontSize="sm" color="gray.500">
        -
      </Text>
    );
  }, [otpTokens]);

  // OTP Token 渲染器
  const OTPCellRenderer = useCallback((props: any) => {
    const test = props.data;
    const testOtpToken = test?.otpToken;

    if (testOtpToken && testOtpToken.trim() !== '') {
      return (
        <VStack align="start" spacing={1} w="full">
          <Text
            fontSize="xs"
            fontFamily="mono"
            title={testOtpToken}
            cursor="help"
            _hover={{ color: 'blue.600' }}
            transition="color 0.2s ease"
          >
            {testOtpToken.substring(0, 8)}...
          </Text>
          <Badge size="xs" colorScheme="orange">
            使用 {otpUsageStats[testOtpToken] || 1} 次
          </Badge>
        </VStack>
      );
    }

    return (
      <Text fontSize="xs" color="gray.500">
        無授權
      </Text>
    );
  }, [otpUsageStats]);

  // 時間顯示渲染器
  const TimeCellRenderer = useCallback((props: any) => {
    const test = props.data;
    const duration = test.testDuration;

    return (
      <VStack align="start" spacing={1}>
        <Text fontSize="sm">
          {formatDate(test.timestamp)}
        </Text>
        {duration && (
          <Badge size="xs" colorScheme="blue">
            {Math.round(duration / 1000)} 秒
          </Badge>
        )}
      </VStack>
    );
  }, []);

  // 列定義
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: '測試時間',
      field: 'timestamp',
      sortable: true,
      filter: 'agDateColumnFilter',
      filterParams: {
        filterOptions: ['equals', 'greaterThan', 'lessThan'],
        defaultOption: 'equals'
      },
      cellRenderer: TimeCellRenderer,
      flex: 2,
      sort: 'desc',
    },
    {
      headerName: '性格類型',
      field: 'personalityType',
      sortable: true,
      filter: 'agTextColumnFilter',
      cellRenderer: PersonalityTypeCellRenderer,
      flex: 1,
      valueGetter: (params) => {
        const personalityClassGroup = getPersonalityClassGroupByTestScores(params.data.testScores);
        return personalityClassGroup.type;
      }
    },
    {
      headerName: '受試者',
      field: 'subjectName',
      sortable: true,
      filter: 'agTextColumnFilter',
      cellRenderer: SubjectCellRenderer,
      flex: 1.5,
      valueGetter: (params) => {
        const testOtpToken = params.data?.otpToken;
        if (testOtpToken && testOtpToken.trim() !== '') {
          const matchedToken = otpTokens.find(token => token.token === testOtpToken);
          return matchedToken?.metadata?.subjectName || '-';
        }
        return '-';
      }
    },
    {
      headerName: 'OTP Token',
      field: 'otpToken',
      sortable: true,
      filter: 'agTextColumnFilter',
      cellRenderer: OTPCellRenderer,
      flex: 1.5,
    },
    {
      headerName: '操作',
      field: 'actions',
      cellRenderer: ActionCellRenderer,
      width: 160,
      sortable: false,
      filter: false,
      pinned: 'right',
    },
  ], [ActionCellRenderer, OTPCellRenderer, PersonalityTypeCellRenderer, TimeCellRenderer, SubjectCellRenderer, otpTokens]);

  // 默認列定義
  const defaultColDef: ColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
  }), []);

  // 導出為 CSV
  const onExportCsv = useCallback(() => {
    const gridApi = gridRef.current?.api;
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `測試結果_${new Date().toISOString().split('T')[0]}.csv`,
      });
    }
  }, []);

  const gridRef = React.useRef<AgGridReact>(null);

  const onGridReady = (params: GridReadyEvent) => {
    console.log('🟢 TestResultsGrid - AG Grid is ready!');
    console.log('📊 Data count:', testResults.length);
    console.log('📋 Sample data:', testResults.slice(0, 2));
    console.log('🔧 Grid API available:', !!params.api);
    params.api.sizeColumnsToFit();
  };


  console.log('🔄 TestResultsGrid rendering with:', testResults.length, 'results');
  console.log('📋 Column definitions:', columnDefs.map(col => col.headerName));

  // 檢查AG Grid是否正確載入
  React.useEffect(() => {
    console.log('🎯 TestResultsGrid useEffect - checking AG Grid');
    console.log('🔍 ag-grid-react version available:', !!AgGridReact);
    console.log('📊 Test data sample:', testResults.slice(0, 1));
  }, [testResults]);

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <HStack spacing={4}>
          {/* 匯出資料下拉選單 */}
          <Menu placement="bottom-end" strategy="fixed">
            <MenuButton as={Button} rightIcon={<Icon as={FiDownload} />} colorScheme="blue" size="sm">
              匯出資料
            </MenuButton>
            <Portal>
              <MenuList zIndex={1500}>
                <MenuItem onClick={onExportData}>
                  <Icon as={FiDownload} mr={2} />
                  匯出 JSON
                </MenuItem>
                <MenuItem onClick={onExportCsv}>
                  <Icon as={FiDownload} mr={2} />
                  匯出 CSV
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>

          {/* 匯入資料下拉選單 */}
          {onImportData && (
            <Menu placement="bottom-end" strategy="fixed">
              <MenuButton as={Button} rightIcon={<Icon as={FiDownload} style={{ transform: 'rotate(180deg)' }} />} colorScheme="green" size="sm">
                匯入資料
              </MenuButton>
              <Portal>
                <MenuList zIndex={1500}>
                  <MenuItem as="label" cursor="pointer">
                    <Icon as={FiDownload} mr={2} style={{ transform: 'rotate(180deg)' }} />
                    匯入 JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={onImportData}
                      style={{ display: 'none' }}
                    />
                  </MenuItem>
                  <MenuItem as="label" cursor="pointer">
                    <Icon as={FiDownload} mr={2} style={{ transform: 'rotate(180deg)' }} />
                    匯入 CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={onImportData}
                      style={{ display: 'none' }}
                    />
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          )}
        </HStack>
      </div>

      <div
        className="ag-theme-quartz"
        style={{
          height: 'calc(100vh - 200px)',
          minHeight: '400px',
          width: '100%',
        }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={testResults}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          pagination={true}
          paginationPageSize={20}
          suppressCellFocus={true}
          rowHeight={56}
          animateRows={true}
          rowSelection="multiple"
        />
      </div>
    </div>
  );
};

export default TestResultsGrid;