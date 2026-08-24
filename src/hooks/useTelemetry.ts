import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type EventRow = {
  session_id: string;
  stage: string;
  event_type: string;
  event_data: Record<string, unknown>;
  client_timestamp: string;
};

const SESSION_KEY = "dp_session_id";
const SESSION_REGISTERED = "dp_session_registered";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

async function ensureSessionRow(sessionId: string) {
  if (typeof window === "undefined") return;
  if (sessionStorage.getItem(SESSION_REGISTERED) === sessionId) return;
  try {
    await supabase.from("sessions").insert({
      id: sessionId,
      user_agent: navigator.userAgent.slice(0, 500),
      screen_size: `${window.innerWidth}x${window.innerHeight}`,
    });
    sessionStorage.setItem(SESSION_REGISTERED, sessionId);
  } catch (e) {
    // swallow; never block UI on logging
    console.warn("[telemetry] session insert failed", e);
  }
}

// One shared in-memory queue across hooks.
const queue: EventRow[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function flush(useBeacon = false) {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/events`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    Prefer: "return=minimal",
  };
  const body = JSON.stringify(batch);
  if (useBeacon && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url + "?apikey=" + headers.apikey, blob);
    return;
  }
  fetch(url, { method: "POST", headers, body, keepalive: true }).catch((e) => {
    console.warn("[telemetry] flush failed", e);
  });
}

export function useTelemetry(stage: string) {
  const sessionIdRef = useRef<string>("");
  if (!sessionIdRef.current) sessionIdRef.current = getSessionId();

  useEffect(() => {
    ensureSessionRow(sessionIdRef.current);
    if (!flushTimer && typeof window !== "undefined") {
      flushTimer = setInterval(() => flush(false), 2000);
      const onUnload = () => flush(true);
      window.addEventListener("pagehide", onUnload);
      window.addEventListener("beforeunload", onUnload);
    }
  }, []);

  const log = useCallback(
    (event_type: string, event_data: Record<string, unknown> = {}) => {
      const row: EventRow = {
        session_id: sessionIdRef.current,
        stage,
        event_type,
        event_data,
        client_timestamp: new Date().toISOString(),
      };
      queue.push(row);
      if (import.meta.env.DEV) {
        console.log("[telemetry]", stage, event_type, event_data);
      }
    },
    [stage],
  );

  return { log, sessionId: sessionIdRef.current };
}
