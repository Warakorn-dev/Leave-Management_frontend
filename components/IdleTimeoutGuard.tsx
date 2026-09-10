"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/axios";
import idleState from "@/lib/idleState";

export function IdleTimeoutGuard({ children }: { children: React.ReactNode }) {
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(60);

  // --- Fetch idle timeout config from backend ---
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get("/auth/config");
        const configData = res.data?.data || res.data;
        if (configData?.idleTimeoutMinutes) {
          const minutes: number = configData.idleTimeoutMinutes;
          setTimeoutMinutes(minutes);
          // Update the shared singleton so axios interceptor uses the same value
          idleState.timeoutMs = minutes * 60 * 1000;
        }
      } catch (err) {
        console.error("Failed to fetch auth config", err);
      }
    };

    if (
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("token")
    ) {
      fetchConfig();
    }
  }, []);

  // --- Track user activity ---
  useEffect(() => {
    const token =
      sessionStorage.getItem("accessToken") || sessionStorage.getItem("token");
    if (!token) return;

    const resetActivity = () => idleState.resetActivity();

    const activityEvents = ["keydown", "mousemove", "click", "touchstart"];
    activityEvents.forEach((evt) =>
      window.addEventListener(evt, resetActivity, { passive: true })
    );

    // Check every 5 seconds for a tighter loop
    const intervalId = setInterval(() => {
      // Skip if popup is already up
      if (idleState.isPopupShowing) return;

      // Skip if not logged in anymore
      const tok =
        sessionStorage.getItem("accessToken") ||
        sessionStorage.getItem("token");
      if (!tok) return;

      if (idleState.isIdle()) {
        clearInterval(intervalId);
        idleState.showExpiredPopup(timeoutMinutes);
      }
    }, 5000);

    return () => {
      activityEvents.forEach((evt) =>
        window.removeEventListener(evt, resetActivity)
      );
      clearInterval(intervalId);
    };
  }, [timeoutMinutes]);

  return <>{children}</>;
}
