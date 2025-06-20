import { toast } from "@/hooks/use-toast";

let ws: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
let silentReconnect = false;

// Define WebSocket URLs
// Use the Replit domain if deployed or localhost for development
// Important: The path must match the server's WebSocketServer path setting ('/ws')
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
// In development, we need to connect to the backend server on port 5000
const wsHost = window.location.hostname === "localhost" ? "localhost:5000" : window.location.host;
const PUBLIC_WS_URL = `${protocol}//${wsHost}/ws`;
// No need for a separate LOCAL_WS_URL since we use window.location.host which includes the port if present

// DO NOT store a reference to the original WebSocket constructor - use the global one
// The HTML has already set up an override that blocks certain problematic connections
// We need to use the overridden version to respect these security measures

// Initialize WebSocket connection
export function createWebSocketConnection() {
  // If a WebSocket instance exists check its state first
  if (ws) {
    // Already connected or attempting to connect, so reuse it
    if (
      ws.readyState === WebSocket.OPEN ||
      ws.readyState === WebSocket.CONNECTING
    ) {
      return ws;
    }

    // If the socket is currently closing, let the onclose handler trigger the
    // reconnection logic instead of forcing a new connection here
    if (ws.readyState === WebSocket.CLOSING) {
      return ws;
    }

    // For any other state (e.g. CLOSED) close the instance before creating a new
    // connection. Calling close() on a CLOSED socket is a no-op but keeps the logic
    // explicit.
    ws.close();
  }

  try {
    // Use the simplified WebSocket URL which handles both HTTP and HTTPS
    const wsUrl = PUBLIC_WS_URL;

    // Validate the WebSocket URL before attempting to connect
    if (!/^wss?:\/\/.+/.test(wsUrl)) {
      throw new Error(`Invalid WebSocket URL: ${wsUrl}`);
    }

    console.log("Connecting to WebSocket at:", wsUrl);

    // Only show toast on first connection attempt
    if (!silentReconnect && reconnectAttempts === 0) {
      toast({
        title: "Connecting to realtime service",
        description: "Establishing connection...",
        variant: "default",
      });
    }

    // Always use the global WebSocket which incorporates the HTML override
    // This ensures we respect the security measures in place
    ws = new WebSocket(wsUrl);
    console.log("Using global WebSocket constructor (with HTML overrides)");

    ws.onopen = () => {
      console.log("WebSocket connection established");

      // Reset reconnect attempts on successful connection
      reconnectAttempts = 0;

      // Show a quick success toast in development only
      if (import.meta.env.DEV && !silentReconnect) {
        toast({
          title: "Realtime connection established",
          duration: 1200,
        });
      }

      // Clear any pending reconnect timers
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      // Tell server about successful connection
      if (ws) {
        ws.send(JSON.stringify({ event: "client:connected", data: {} }));
      }

      // After successful connection, future reconnects should be silent
      silentReconnect = true;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Simple one-line log for quick debugging
        console.log("WebSocket message received:", data);

        // More detailed logging for deeper debugging
        console.log(`WebSocket message details - Event: ${data.event}`, {
          timestamp: new Date().toISOString(),
          eventType: data.event,
          fullData: data.data,
          rawMessage: event.data,
        });

        // Dispatch custom event with the data so components can listen for it
        const customEvent = new CustomEvent("ws-message", { detail: data });
        window.dispatchEvent(customEvent);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");

      // Show toast only on non-silent reconnects and not too frequently
      if (!silentReconnect && reconnectAttempts === 0) {
        toast({
          title: "Realtime connection disconnected",
          description: "Updates may be delayed. Reconnecting...",
          variant: "destructive",
        });
      }

      // Increment reconnect attempts
      reconnectAttempts++;

      // Exponential backoff for reconnection attempts
      const reconnectDelay = Math.min(
        3000 * Math.pow(1.5, reconnectAttempts - 1),
        30000,
      );

      // Attempt to reconnect after a delay
      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
          reconnectTimeout = null;
          createWebSocketConnection();
        }, reconnectDelay);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);

      // Only show error toast if not in silent mode and not too frequently
      if (!silentReconnect && reconnectAttempts < 2) {
        toast({
          title: "Connection error",
          description: "There was a problem with the realtime connection",
          variant: "destructive",
        });
      }

      // WebSocket will automatically close after an error, which will trigger reconnect
    };
  } catch (error) {
    console.error("Failed to create WebSocket connection:", error);

    // Show error toast only if this is the first attempt
    if (!silentReconnect && reconnectAttempts === 0) {
      toast({
        title: "Connection failed",
        description:
          "Could not establish realtime connection. Some features may not work properly.",
        variant: "destructive",
      });
    }

    // Increment reconnect attempts
    reconnectAttempts++;

    // Try again after a delay
    if (!reconnectTimeout) {
      const reconnectDelay = Math.min(
        3000 * Math.pow(1.5, reconnectAttempts - 1),
        30000,
      );
      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        createWebSocketConnection();
      }, reconnectDelay);
    }
  }

  return ws;
}

// Track active debounce timers by event type
const debounceTimers: Record<string, NodeJS.Timeout> = {};
const DEBOUNCE_DELAY = 300; // ms

// Enhanced cache for recently seen events to prevent duplicate processing
// This is useful for event bursts that may come from different components
const recentEventCache: Record<string, { timestamp: number; data: any }> = {};
const EVENT_CACHE_TTL = 2000; // 2 seconds

// Listen for specific channel events with built-in debouncing
export function subscribeToChannel(
  event: string,
  callback: (data: any) => void,
) {
  console.log(`Subscribing to WebSocket channel: ${event}`);

  const handler = (e: CustomEvent) => {
    const wsEvent = e.detail.event;
    const wsData = e.detail.data;

    // Enhanced pattern matching for event subscriptions
    // 1. Empty string catches ALL events (e.g., "" matches everything)
    // 2. Exact match (e.g., "transaction:earn" === "transaction:earn")
    // 3. Pattern match (e.g., "transaction:earn".startsWith("transaction:"))
    const isCatchAll = event === "";
    const isExactMatch = wsEvent === event;
    const isPatternMatch = event.endsWith(":") && wsEvent.startsWith(event);
    const isMatch = isCatchAll || isExactMatch || isPatternMatch;

    if (isMatch) {
      // For debugging purposes, log match information
      if (isCatchAll) {
        // Don't flood console with catch-all debug info
        console.log(`Caught all-events subscriber for "${wsEvent}"`);
      } else {
        console.log(`Event match for "${event}" - received "${wsEvent}"`);
      }

      // First check the recently seen events cache to avoid redundant processing
      const eventCacheKey = `${event}:${wsEvent}:${JSON.stringify(wsData).slice(0, 100)}`;
      const now = Date.now();
      const cachedEvent = recentEventCache[eventCacheKey];

      if (cachedEvent && now - cachedEvent.timestamp < EVENT_CACHE_TTL) {
        console.log(
          `[OPTIMIZED] Skipping duplicate event "${wsEvent}" (seen ${(now - cachedEvent.timestamp) / 1000}s ago)`,
        );
        return;
      }

      // Store in recently seen cache
      recentEventCache[eventCacheKey] = {
        timestamp: now,
        data: wsData,
      };

      // Clean up old cache entries periodically
      if (now % 10 === 0) {
        // Clean up approximately every 10 events
        Object.keys(recentEventCache).forEach((key) => {
          if (now - recentEventCache[key].timestamp > EVENT_CACHE_TTL) {
            delete recentEventCache[key];
          }
        });
      }

      // Use global debouncing for each event type to prevent multiple callbacks
      // For transaction-related events, apply additional debouncing
      if (
        wsEvent.startsWith("transaction:") ||
        event.startsWith("transaction:")
      ) {
        // Create a specific key for this subscription to prevent cross-component interference
        const debounceKey = `${event}:${wsEvent}`;

        // Clear any existing timer for this event
        if (debounceTimers[debounceKey]) {
          clearTimeout(debounceTimers[debounceKey]);
        }

        // Set a new timer
        debounceTimers[debounceKey] = setTimeout(() => {
          // Pass the entire event object to the callback
          callback({
            event: wsEvent,
            data: wsData,
          });

          // Clean up the timer reference
          delete debounceTimers[debounceKey];
        }, DEBOUNCE_DELAY);
      } else {
        // For non-transaction events, execute immediately
        callback({
          event: wsEvent,
          data: wsData,
        });
      }
    }
  };

  // TypeScript wants us to cast the custom event properly
  window.addEventListener("ws-message", handler as EventListener);

  // Return unsubscribe function
  return () => {
    window.removeEventListener("ws-message", handler as EventListener);
  };
}

// Send message to server
export function sendMessage(event: string, data: any) {
  console.log(`Attempting to send WebSocket message - Event: ${event}`, {
    data: data,
    wsReadyState: ws ? ws.readyState : "No WebSocket",
    wsOpen: ws ? ws.readyState === WebSocket.OPEN : false,
    timestamp: new Date().toISOString(),
  });

  if (ws && ws.readyState === WebSocket.OPEN) {
    const messageJson = JSON.stringify({ event, data });
    console.log(`Sending WebSocket message: ${messageJson}`);
    ws.send(messageJson);
    return true;
  } else {
    console.log(
      "WebSocket is not connected, attempting to reconnect before sending",
    );

    // Try to reconnect first
    const newWs = createWebSocketConnection();

    // If we managed to create a new WebSocket instance, wait for it to connect
    if (newWs) {
      const sendAfterConnect = () => {
        console.log(
          `Attempting to send delayed message after connection - Event: ${event}`,
          {
            wsReadyState: ws ? ws.readyState : "No WebSocket",
            wsOpen: ws ? ws.readyState === WebSocket.OPEN : false,
          },
        );

        // Check if the connection is now open
        if (ws && ws.readyState === WebSocket.OPEN) {
          // Send the message
          const messageJson = JSON.stringify({ event, data });
          console.log(`Sending delayed WebSocket message: ${messageJson}`);
          ws.send(messageJson);

          // Remove the event listener as we've now sent the message
          if (newWs) {
            newWs.removeEventListener("open", sendAfterConnect);
          }
          return true;
        }

        console.log("Connection still not ready, message not sent");
        return false;
      };

      // If the connection is already open, send immediately
      if (sendAfterConnect()) {
        console.log("Message sent immediately after reconnection");
        return true;
      }

      // Otherwise wait for the connection to open
      if (newWs) {
        console.log(
          "Adding event listener for open event to send message later",
        );
        newWs.addEventListener("open", sendAfterConnect, { once: true });
        // Return false to indicate the message wasn't sent immediately
        return false;
      }
    }

    console.error("WebSocket connection failed, message not sent", {
      event: event,
      data: data,
      wsStatus: ws ? `Ready state: ${ws.readyState}` : "No WebSocket instance",
    });
    return false;
  }
}
