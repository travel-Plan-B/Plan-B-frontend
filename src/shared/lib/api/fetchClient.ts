const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// 모든 feature가 공유하는 최소한의 fetch wrapper. base URL과 공통 에러 변환만 담당하고,
// endpoint별 요청/응답 매핑은 각 feature의 api/ 폴더에서 한다 (folder-structure.md 참고).
export async function fetchClient<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.error?.message ?? "요청을 처리하지 못했습니다.";
    throw new ApiError(message, response.status);
  }

  return body as T;
}
