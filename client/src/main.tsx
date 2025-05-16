// The WebSocket override has been moved to index.html
// This allows the override to execute before any module code can run
console.log('[DEBUG] Main.tsx: Relying on the HTML WebSocket override.');

// Add a debugger statement to help identify the problematic WebSocket calls if needed
// This can be uncommented for debugging purposes
// debugger;


// All other imports and application code MUST come AFTER the override block.
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { createWebSocketConnection } from "./lib/supabase"; // Your app's WebSocket
import { toast } from "@/hooks/use-toast";

// Initialize your app's WebSocket connection
// This should now use the overridden window.WebSocket, which will delegate to NativeWebSocketOriginal
// for allowed URLs.
createWebSocketConnection();

createRoot(document.getElementById("root")!).render(<App />);
