// client/src/lib/dummy-neon-serverless.ts
// This file provides a dummy Neon serverless module for the client-side.
export const neonConfig = {
  // Prevent attempts to set webSocketConstructor
  set webSocketConstructor(value: any) {
    console.warn("Attempt to set neonConfig.webSocketConstructor on client blocked.");
  },
  get webSocketConstructor() {
    return undefined;
  }
  // Mock other neonConfig properties if needed to prevent errors during import
};

// Mock Pool class
export class Pool {
  constructor(options: any) {
    console.warn("Neon Database Pool cannot be constructed in the browser.");
  }
  
  connect() {
    return Promise.reject(new Error("Neon Database connections are not allowed in the browser."));
  }
  
  query() {
    return Promise.reject(new Error("Neon Database queries are not allowed in the browser."));
  }
  
  end() {
    return Promise.resolve();
  }
}

export function neon() {
  const message = "The neon() function (Neon serverless driver) is not available on the client-side.";
  console.warn(message);
  throw new Error(message);
}

// Mock any other exports from @neondatabase/serverless that might be accessed.
export default {
  neon,
  neonConfig,
  Pool,
};
