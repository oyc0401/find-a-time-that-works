export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

export const customFetch = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      (errorBody as { message?: string }).message || `HTTP ${response.status}`,
    );
  }

  const data = await response.json();

  return { data, status: response.status, headers: response.headers } as T;
};
