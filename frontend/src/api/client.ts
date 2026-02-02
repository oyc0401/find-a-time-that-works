import { useApiErrorStore } from "../stores/useApiErrorStore";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

const setApiError = (message: string) => {
  useApiErrorStore.getState().setError(message);
};

export const customFetch = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...options?.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
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
