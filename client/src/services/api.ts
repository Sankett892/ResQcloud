const BASE_URL = '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let inMemoryToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  inMemoryToken = token;
  if (token) {
    localStorage.setItem('resqcloud_cached_token', token);
  } else {
    localStorage.removeItem('resqcloud_cached_token');
  }
};

export const getAuthToken = (): string | null => {
  if (!inMemoryToken) {
    inMemoryToken = localStorage.getItem('resqcloud_cached_token');
  }
  return inMemoryToken;
};

export const apiFetch = async <T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getAuthToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // sends HTTP-only cookies
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.error || `Request failed with status ${res.status}`;
      throw new ApiError(errorMsg, res.status, json);
    }

    return json;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error / server down
    throw new ApiError('Server is currently unreachable. Network or server error.', 0, null);
  }
};
