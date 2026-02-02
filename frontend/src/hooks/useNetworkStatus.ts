import { useState, useEffect } from "react";
import { getNetworkStatus } from "@apps-in-toss/web-framework";

export function useNetworkStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const status = await getNetworkStatus();
      if (mounted) {
        setOnline(status !== "OFFLINE");
      }
    };

    check();

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") check();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mounted = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return online;
}
