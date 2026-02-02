import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

export function useLocale() {
  const { i18n: instance } = useTranslation();
  const lang = instance.language?.startsWith("ko") ? "ko" : "en";
  return lang;
}

export function getLocale(): "ko" | "en" {
  const lang = i18n.language;
  return lang?.startsWith("ko") ? "ko" : "en";
}
