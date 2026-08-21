import ky, { HTTPError } from "ky";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface FetchClientOptions {
  method?: string;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null && "error" in data) {
    const { error } = data as { error?: { message?: string } };
    return error?.message ?? fallback;
  }
  return fallback;
}

// next.config.ts의 rewrites가 /api/v1/*, /health를 백엔드로 프록시한다.
// 백엔드가 CORS 헤더를 내려주지 않아 브라우저에서 절대 URL로 직접 호출하면 막힌다 (같은 origin으로만 요청).
export async function fetchClient<T>(
  path: string,
  { params, body, ...options }: FetchClientOptions = {},
): Promise<T> {
  try {
    const response = await ky(path, {
      ...options,
      searchParams: params,
      json: body,
    });

    if (response.status === 204) return undefined as T;
    return await response.json<T>();
  } catch (error) {
    if (error instanceof HTTPError) {
      const message = extractErrorMessage(
        error.data,
        error.response.statusText,
      );
      throw new ApiError(error.response.status, message);
    }
    throw error;
  }
}
