import { create } from "zustand";

interface ApiErrorState {
  errorMessage?: string;
  setError: (message: string) => void;
  clearError: () => void;
}

export const useApiErrorStore = create<ApiErrorState>((set) => ({
  errorMessage: undefined,
  setError: (message) => set({ errorMessage: message }),
  clearError: () => set({ errorMessage: undefined }),
}));
