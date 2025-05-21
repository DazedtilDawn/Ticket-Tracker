import { useEffect, useState } from "react";
import { subscribeToChannel, createWebSocketConnection } from "@/lib/websocketClient";

export default function WebsocketDebugMonitor() {
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    createWebSocketConnection();
    const unsub = subscribeToChannel("", (e) => {
      const msg = `[${new Date().toLocaleTimeString()}] ${e.event}`;
      setEvents((prev) => [msg, ...prev].slice(0, 10));
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  return (
    <div className="fixed bottom-0 right-0 m-2 max-h-40 w-64 overflow-y-auto rounded bg-black/80 p-2 text-xs text-white z-50">
      {events.map((e, i) => (
        <div key={i}>{e}</div>
      ))}
    </div>
  );
}
