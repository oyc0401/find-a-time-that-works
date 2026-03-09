import { useEffect } from "react";
import { useApiErrorStore } from "../stores/useApiErrorStore";

export function ApiErrorAlert() {
  const errorMessage = useApiErrorStore((s) => s.errorMessage);
  const clearError = useApiErrorStore((s) => s.clearError);

  useEffect(() => {
    if (!errorMessage) return;

    clearError();

    window.alert(errorMessage);
  }, [errorMessage, clearError]);

  return null;
}
