import type { NextApiRequest, NextApiResponse } from 'next';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    username: string;
    isAuthenticated: boolean;
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: '僅支援 POST 請求'
    });
  }

  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '請提供使用者名稱和密碼'
      });
    }

    // 驗證憑證
    const adminUsername = process.env.ADMIN_USERNAME || 'twnoc-yjmbti';
    const adminPassword = process.env.ADMIN_PASSWORD || 'default-password';

    if (username === adminUsername && password === adminPassword) {
      return res.status(200).json({
        success: true,
        message: '登入成功',
        user: {
          username,
          isAuthenticated: true
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: '帳號或密碼錯誤'
      });
    }
  } catch (error) {
    console.error('登入 API 錯誤:', error);
    return res.status(500).json({
      success: false,
      message: '伺服器內部錯誤'
    });
  }
}