import React, { useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  CellClickedEvent,
} from 'ag-grid-community';
import {
  Badge,
  HStack,
  IconButton,
  Button,
  Text,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { FiTrash2, FiEye, FiDownload } from 'react-icons/fi';
import { FirebaseTestResult } from '../../lib/firebase';
import { getPersonalityClassGroupByTestScores } from '../../lib/personality-test';

interface TestResultsGridProps {
  testResults: FirebaseTestResult[];
  otpUsageStats: { [token: string]: number };
  onDeleteTest: (testId: string) => void;
  onViewReport: (personalityType: string, testScores: any[]) => void;
}

const TestResultsGrid: React.FC<TestResultsGridProps> = ({
  testResults,
  otpUsageStats,
  onDeleteTest,
  onViewReport,
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

  // OTP Token 渲染器
  const OTPCellRenderer = useCallback((props: any) => {
    const test = props.data;
    const testOtpToken = test?.otpToken;

    if (testOtpToken && testOtpToken.trim() !== '') {
      return (
        <VStack align="start" spacing={1}>
          <Text fontSize="xs" fontFamily="mono">
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
      cellRenderer: TimeCellRenderer,
      width: 180,
      sort: 'desc',
    },
    {
      headerName: '性格類型',
      field: 'personalityType',
      sortable: true,
      filter: 'agTextColumnFilter',
      cellRenderer: PersonalityTypeCellRenderer,
      width: 120,
      valueGetter: (params) => {
        const personalityClassGroup = getPersonalityClassGroupByTestScores(params.data.testScores);
        return personalityClassGroup.type;
      }
    },
    {
      headerName: '來源',
      field: 'source',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 100,
      cellRenderer: () => (
        <Badge colorScheme="green" size="sm">
          Firebase
        </Badge>
      )
    },
    {
      headerName: 'OTP Token',
      field: 'otpToken',
      sortable: true,
      filter: 'agTextColumnFilter',
      cellRenderer: OTPCellRenderer,
      width: 160,
    },
    {
      headerName: '操作',
      field: 'actions',
      cellRenderer: ActionCellRenderer,
      width: 200,
      sortable: false,
      filter: false,
      pinned: 'right',
    },
  ], [ActionCellRenderer, OTPCellRenderer, PersonalityTypeCellRenderer, TimeCellRenderer]);

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
    params.api.sizeColumnsToFit();
  };

  return (
    <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
      <HStack mb={4} justify="space-between">
        <Text fontSize="lg" fontWeight="bold">
          測試結果 ({testResults.length} 筆記錄)
        </Text>
        <Button
          leftIcon={<FiDownload />}
          onClick={onExportCsv}
          size="sm"
          colorScheme="blue"
        >
          匯出 CSV
        </Button>
      </HStack>

      <AgGridReact
        ref={gridRef}
        rowData={testResults}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        pagination={true}
        paginationPageSize={20}
        suppressCellFocus={true}
        rowHeight={60}
        animateRows={true}
        enableRangeSelection={true}
        suppressRowClickSelection={true}
      />
    </div>
  );
};

export default TestResultsGrid;