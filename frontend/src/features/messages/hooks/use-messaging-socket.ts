"use client";

import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { socketTicketAction } from "@/features/messages/actions/messaging";
import type { Message, MessagingEvent, ReadState } from "@/features/messages/types";

export function useMessagingSocket(onEvent: (event: MessagingEvent) => void) {
  const [online, setOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const receive = useEffectEvent(onEvent);

  useEffect(() => {
    let stopped = false;
    let socket: Socket | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    let connecting = false;
    const schedule = () => {
      if (stopped || timer || failures >= 6) return;
      timer = setTimeout(() => { timer = undefined; connect(); }, Math.min(1000 * 2 ** failures++, 30000));
    };
    const connect = () => {
      if (stopped || connecting) return;
      connecting = true;
      socket?.removeAllListeners();
      if (socket) { socket.auth = {}; socket.disconnect(); }
      startTransition(async () => {
        try {
          const ticket = await socketTicketAction();
          if (stopped) return;
          if (!ticket.data) { setError(ticket.error); schedule(); return; }
          const url = process.env.NEXT_PUBLIC_MESSAGING_SOCKET_URL;
          if (!url) { setError("La connexion temps réel n'est pas configurée."); return; }
          socket = io(url, { autoConnect: false, reconnection: false, auth: { ticket: ticket.data.token }, timeout: 10000 });
          socket.on("connect", () => {
            failures = 0;
            setOnline(true);
            setError(null);
            receive({ type: "connected" });
          });
          socket.on("disconnect", () => { setOnline(false); schedule(); });
          socket.on("connect_error", () => { setOnline(false); setError("Connexion interrompue. Vos messages restent enregistrés."); schedule(); });
          socket.on("messaging:message-created", (event: { version: number; message: Message }) => {
            if (event.version === 1) receive({ type: "message", message: event.message });
          });
          socket.on("messaging:read-updated", (event: { version: number; conversation_id: number; read_state: ReadState }) => {
            if (event.version === 1) receive({ type: "read", conversation_id: event.conversation_id, read_state: event.read_state });
          });
          socket.connect();
        } catch {
          if (!stopped) { setError("Impossible de rétablir la connexion."); schedule(); }
        } finally { connecting = false; }
      });
    };
    const resume = () => {
      if (document.visibilityState === "visible") {
        receive({ type: "connected" });
        if (!socket?.connected) { failures = 0; connect(); }
      }
    };
    const offline = () => setOnline(false);
    connect();
    window.addEventListener("online", resume);
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", resume);
    const reconciliation = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) receive({ type: "connected" });
    }, 20000);
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearInterval(reconciliation);
      socket?.removeAllListeners();
      if (socket) { socket.auth = {}; socket.disconnect(); }
      window.removeEventListener("online", resume);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [attempt]);

  return { online, error, retry: () => setAttempt((value) => value + 1) };
}