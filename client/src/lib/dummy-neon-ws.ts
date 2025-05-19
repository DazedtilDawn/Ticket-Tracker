// client/src/lib/dummy-neon-ws.ts
// This file provides a dummy WebSocket constructor to prevent Neon's client-side WS attempts.
export default function WebSocket() {
  const message = "Neon Database WebSocket connections are not allowed from the client-side.";
  console.warn(message);
  // Return a mock WebSocket object that does nothing or throws.
  return {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    close: () => {},
    send: () => {},
    readyState: 3, // WebSocket.CLOSED
    CONNECTING: 0, 
    OPEN: 1, 
    CLOSING: 2, 
    CLOSED: 3,
    url: '', 
    protocol: '', 
    extensions: '', 
    bufferedAmount: 0,
    onopen: null, 
    onerror: null, 
    onclose: null, 
    onmessage: null,
    binaryType: 'blob'
  };
}

// Also export a named WebSocket for consistency if the library tries to import it that way.
export { WebSocket as WebSocketClass };
