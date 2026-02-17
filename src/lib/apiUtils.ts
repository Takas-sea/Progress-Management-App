/**
 * API ルートの共通ユーティリティ関数
 */

/**
 * リクエストボディのバリデーション
 */
export const validateStudyLogBody = (body: any): { valid: boolean; error?: string } => {
  if (!body) {
    return { valid: false, error: 'Request body is required' };
  }

  if (typeof body.title !== 'string') {
    return { valid: false, error: 'Title is required and must be a string' };
  }

  if (body.title.trim() === '') {
    return { valid: false, error: 'Title cannot be empty' };
  }

  if (body.minutes === undefined || body.minutes === null) {
    return { valid: false, error: 'Minutes is required' };
  }

  if (typeof body.minutes !== 'number') {
    return { valid: false, error: 'Minutes must be a number' };
  }

  if (body.minutes <= 0) {
    return { valid: false, error: 'Minutes must be greater than 0' };
  }

  if (body.minutes > 1440) {
    return { valid: false, error: 'Minutes cannot exceed 1440 (24 hours)' };
  }

  if (!body.date || typeof body.date !== 'string') {
    return { valid: false, error: 'Date is required and must be a string' };
  }

  // ISO 8601 形式の日付を検証
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(body.date)) {
    return { valid: false, error: 'Date must be in YYYY-MM-DD format' };
  }

  // 日付が有効か確認
  const date = new Date(body.date);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date' };
  }

  return { valid: true };
};

/**
 * Authorization ヘッダーからトークンを抽出
 */
export const extractTokenFromHeader = (authHeader: string | null): { token?: string; error?: string } => {
  if (!authHeader) {
    return { error: 'Authorization header is missing' };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return { error: 'Authorization header must start with "Bearer "' };
  }

  const token = authHeader.substring(7);
  if (!token) {
    return { error: 'Token is empty' };
  }

  return { token };
};

/**
 * クエリパラメータからidを抽出
 */
export const extractIdFromUrl = (url: string): { id?: string; error?: string } => {
  if (!url) {
    return { error: 'URL is required' };
  }

  try {
    const searchParams = new URL(url).searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return { error: 'ID is required' };
    }

    if (typeof id !== 'string' || id.trim() === '') {
      return { error: 'ID must be a non-empty string' };
    }

    return { id };
  } catch (error) {
    return { error: 'Invalid URL' };
  }
};

/**
 * API エラーレスポンスを生成
 */
export const createErrorResponse = (
  error: string,
  details?: string,
  status: number = 400
): { error: string; details?: string; status: number } => {
  return {
    error,
    ...(details && { details }),
    status
  };
};

/**
 * API 成功レスポンスを生成
 */
export const createSuccessResponse = (data: any, status: number = 200): { data: any; status: number } => {
  return { data, status };
};

/**
 * リクエストボディのパース
 */
export const parseRequestBody = async (req: Request): Promise<{ body?: any; error?: string }> => {
  try {
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return { error: 'Content-Type must be application/json' };
    }

    const text = await req.text();
    if (!text) {
      return { error: 'Request body cannot be empty' };
    }

    const body = JSON.parse(text);
    return { body };
  } catch (error) {
    return { error: 'Invalid JSON in request body' };
  }
};
