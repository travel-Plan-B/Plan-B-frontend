import ky, { HTTPError } from "ky";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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

export async function fetchClient<T>(
  path: string,
  { params, body, ...options }: FetchClientOptions = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다. .env.local을 확인하세요.",
    );
  }

  try {
    const response = await ky(new URL(path, API_BASE_URL), {
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
