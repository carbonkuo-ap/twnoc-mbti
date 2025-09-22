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
  Icon,
  useClipboard,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
} from '@chakra-ui/react';
import { FiTrash2, FiCopy, FiDownload, FiExternalLink } from 'react-icons/fi';
import { OTPToken } from '../../lib/otp';

interface OTPTokensGridProps {
  tokens: OTPToken[];
  onDeleteToken: (token: string) => void;
}

const OTPTokensGrid: React.FC<OTPTokensGridProps> = ({
  tokens,
  onDeleteToken,
}) => {
  const toast = useToast();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-TW');
  };

  const generateShareableOTPUrl = (token: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return `${baseUrl}${basePath}/?otp=${encodeURIComponent(token)}`;
  };

  // 操作按鈕渲染器
  const ActionCellRenderer = useCallback((props: any) => {
    const token = props.data as OTPToken;

    // 複製 URL 按鈕組件
    const CopyUrlButton: React.FC<{ token: string }> = ({ token }) => {
      const url = generateShareableOTPUrl(token);
      const { onCopy } = useClipboard(url);

      const handleCopy = () => {
        onCopy();
        toast({
          title: '已複製到剪貼板',
          description: '測試連結已複製',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      };

      return (
        <IconButton
          icon={<Icon as={FiCopy} />}
          aria-label="複製連結"
          size="sm"
          variant="outline"
          onClick={handleCopy}
          title="複製測試連結"
        />
      );
    };

    return (
      <HStack spacing={2} h="100%" align="center">
        <CopyUrlButton token={token.token} />
        <IconButton
          icon={<Icon as={FiExternalLink} />}
          aria-label="開啟連結"
          size="sm"
          variant="outline"
          onClick={() => {
            const url = generateShareableOTPUrl(token.token);
            window.open(url, '_blank');
          }}
          title="在新視窗開啟測試連結"
        />
        <IconButton
          icon={<Icon as={FiTrash2} />}
          aria-label="刪除"
          size="sm"
          colorScheme="red"
          variant="outline"
          onClick={() => onDeleteToken(token.token)}
        />
      </HStack>
    );
  }, [onDeleteToken, toast]);

  // Token 渲染器
  const TokenCellRenderer = (props: any) => {
    const token = props.data as OTPToken;

    return (
      <Text
        fontFamily="mono"
        fontSize="sm"
        title={token.token}
        cursor="help"
        _hover={{ color: 'blue.600' }}
        transition="color 0.2s ease"
      >
        {token.token.substring(0, 8)}...
      </Text>
    );
  };

  // 狀態渲染器
  const StatusCellRenderer = (props: any) => {
    const token = props.data as OTPToken;

    let colorScheme = 'green';
    let statusText = '活躍';

    if (token.usedAt) {
      colorScheme = 'blue';
      statusText = '已使用';
    } else if (token.expiresAt <= Date.now()) {
      colorScheme = 'red';
      statusText = '已過期';
    }

    return (
      <Badge colorScheme={colorScheme}>
        {statusText}
      </Badge>
    );
  };

  // 受試者名稱渲染器
  const SubjectCellRenderer = (props: any) => {
    const token = props.data as OTPToken;
    const subjectName = token.metadata?.subjectName;

    if (!subjectName) {
      return <Text color="gray.500" fontSize="sm">-</Text>;
    }

    return (
      <Text fontSize="sm" title={subjectName}>
        {subjectName}
      </Text>
    );
  };

  // 列定義
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'Token',
      field: 'token',
      sortable: true,
      filter: 'agTextColumnFilter',
      cellRenderer: TokenCellRenderer,
      width: 120,
    },
    {
      headerName: '受試者',
      field: 'subjectName',
      sortable: true,
      filter: 'agTextColumnFilter',
      cellRenderer: SubjectCellRenderer,
      width: 150,
      valueGetter: (params) => params.data.metadata?.subjectName || '',
    },
    {
      headerName: '建立時間',
      field: 'createdAt',
      sortable: true,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => formatDate(params.value),
      width: 180,
      sort: 'desc',
    },
    {
      headerName: '過期時間',
      field: 'expiresAt',
      sortable: true,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => formatDate(params.value),
      width: 180,
    },
    {
      headerName: '使用時間',
      field: 'usedAt',
      sortable: true,
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => params.value ? formatDate(params.value) : '-',
      width: 180,
    },
    {
      headerName: '狀態',
      field: 'status',
      sortable: true,
      filter: 'agTextColumnFilter',
      cellRenderer: StatusCellRenderer,
      width: 100,
      valueGetter: (params) => {
        const token = params.data as OTPToken;
        if (token.usedAt) return '已使用';
        if (token.expiresAt <= Date.now()) return '已過期';
        return '活躍';
      }
    },
    {
      headerName: '操作',
      field: 'actions',
      cellRenderer: ActionCellRenderer,
      width: 180,
      sortable: false,
      filter: false,
      pinned: 'right',
    },
  ], [ActionCellRenderer]);

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
        fileName: `OTP_Tokens_${new Date().toISOString().split('T')[0]}.csv`,
        columnKeys: ['token', 'subjectName', 'createdAt', 'expiresAt', 'usedAt', 'status'],
      });
    }
  }, []);

  const gridRef = React.useRef<AgGridReact>(null);

  const onGridReady = (params: GridReadyEvent) => {
    console.log('🟢 OTPTokensGrid - AG Grid is ready!');
    console.log('📊 Tokens count:', tokens.length);
    console.log('📋 Sample tokens:', tokens.slice(0, 2));
    console.log('🔧 Grid API available:', !!params.api);
    params.api.sizeColumnsToFit();
  };


  console.log('🔄 OTPTokensGrid rendering with:', tokens.length, 'tokens');
  console.log('📋 Column definitions:', columnDefs.map(col => col.headerName));

  // 檢查AG Grid是否正確載入
  React.useEffect(() => {
    console.log('🎯 OTPTokensGrid useEffect - checking AG Grid');
    console.log('🔍 ag-grid-react version available:', !!AgGridReact);
    console.log('📊 Token data sample:', tokens.slice(0, 1));
  }, [tokens]);

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <Menu placement="bottom-end" strategy="fixed">
          <MenuButton as={Button} rightIcon={<Icon as={FiDownload} />} colorScheme="blue" size="sm">
            匯出資料
          </MenuButton>
          <Portal>
            <MenuList zIndex={1500}>
              <MenuItem onClick={onExportCsv}>
                <Icon as={FiDownload} mr={2} />
                匯出 CSV
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
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
          rowData={tokens}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          pagination={true}
          paginationPageSize={15}
          suppressCellFocus={true}
          rowHeight={48}
          animateRows={true}
          rowSelection="multiple"
        />
      </div>
    </div>
  );
};

export default OTPTokensGrid;