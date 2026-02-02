import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import * as Sentry from "@sentry/react";
import { queryClient } from "./api/query-client";
import App from "./App";
import "./index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // 성능 모니터링 샘플링 비율 (0.0 ~ 1.0)
  tracesSampleRate: 1.0,
  // 세션 리플레이 샘플링 비율
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TDSMobileAITProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </TDSMobileAITProvider>
  </StrictMode>
);
