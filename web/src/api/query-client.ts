import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { useApiErrorStore } from "../stores/useApiErrorStore";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // meta.silent가 true면 알림 표시하지 않음
      if (query.meta?.silent) return;

      const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했어요";
      useApiErrorStore.getState().setError(message);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // meta.silent가 true면 알림 표시하지 않음
      if (mutation.meta?.silent) return;

      const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했어요";
      useApiErrorStore.getState().setError(message);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});
