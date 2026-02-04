import { useApiErrorStore } from "../stores/useApiErrorStore";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const setApiError = (message: string) => {
  useApiErrorStore.getState().setError(message);
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const customFetch = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  let response: Response | undefined;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
          ...options?.headers,
        },
      });
      lastError = undefined;
      break;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES - 1) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  if (lastError || !response) {
    const method = options?.method ?? "GET";
    const message = `서버에 연결할 수 없어요 (${method} ${url})`;
    setApiError(message);
    throw new Error(message);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const method = options?.method ?? "GET";
    const message =
      (errorBody as { message?: string }).message ||
      `HTTP ${response.status} (${method} ${url})`;

    setApiError(message);

    throw new Error(message);
  }

  const data = await response.json();

  return { data, status: response.status, headers: response.headers } as T;
};
