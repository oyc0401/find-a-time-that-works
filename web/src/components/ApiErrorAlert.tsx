import { useEffect } from "react";
import { useDialog } from "@toss/tds-mobile";
import { useApiErrorStore } from "../stores/useApiErrorStore";

export function ApiErrorAlert() {
  const { openAlert } = useDialog();
  const errorMessage = useApiErrorStore((s) => s.errorMessage);
  const clearError = useApiErrorStore((s) => s.clearError);

  useEffect(() => {
    if (!errorMessage) return;

    clearError();

    openAlert({
      title: "오류가 발생했어요",
      description: errorMessage,
      alertButton: "확인",
    });
  }, [errorMessage, openAlert, clearError]);

  return null;
}
