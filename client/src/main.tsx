// The WebSocket override has been moved to index.html
// This allows the override to execute before any module code can run
console.log("[DEBUG] Main.tsx: Relying on the HTML WebSocket override.");

// All other imports and application code MUST come AFTER the override block.
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { createWebSocketConnection } from "./lib/websocketClient"; // Your app's WebSocket
import { toast } from "@/hooks/use-toast";
import {
  requestNotificationPermission,
  setupConnectivityListeners,
  showToast,
  getDeviceInfo,
} from "./mobileIntegration";

// Initialize your app's WebSocket connection
createWebSocketConnection();

// Register service worker for PWA functionality
if (
  "serviceWorker" in navigator &&
  window.location.hostname !== "localhost" &&
  !window.location.hostname.includes(".replit.dev")
) {
  // Only register in production environment, not in development
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope,
        );
      })
      .catch((error) => {
        // This is expected to fail in development, so we'll just log it without showing an error
        console.log(
          "ServiceWorker registration skipped (development environment)",
        );
      });
  });
}

// Check device type and environment
const deviceInfo = getDeviceInfo();
console.log(
  `App running on ${deviceInfo.isAndroid ? "Android" : "browser"}, ${deviceInfo.isApp ? "in native app" : "in browser"}`,
);

// Setup offline/online detection
setupConnectivityListeners(
  // Online callback
  () => {
    console.log("App is back online");
    toast({
      title: "You're back online",
      description: "Connected to the internet",
      duration: 3000,
    });
  },
  // Offline callback
  () => {
    console.log("App is offline");
    toast({
      title: "You're offline",
      description: "Some features may be limited",
      variant: "destructive",
      duration: 5000,
    });
  },
);

// Request notification permissions (will be handled differently in native app vs browser)
requestNotificationPermission().then((granted) => {
  if (granted) {
    console.log("Notification permission granted");
  }
});

createRoot(document.getElementById("root")!).render(<App />);
