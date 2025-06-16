/**
 * Mobile Integration Module
 *
 * This module handles integration between our web app and native Android features
 * when running inside a WebView. It detects the environment and provides
 * appropriate APIs for native functionality.
 */

interface AndroidInterface {
  vibrate(durationMs: number): void;
  showToast(message: string): void;
  getDeviceInfo(): string;
  setNotification(title: string, message: string, timestamp: number): void;
  clearNotification(id: string): void;
}

// Check if running inside Android WebView
const isAndroidApp = (): boolean => {
  return typeof (window as any).Android !== "undefined";
};

// Safe access to Android interface
const getAndroidInterface = (): AndroidInterface | null => {
  if (isAndroidApp()) {
    return (window as any).Android as AndroidInterface;
  }
  return null;
};

// Progressive enhancement - only use native features when available
export const vibrate = (pattern: number | number[]): void => {
  const android = getAndroidInterface();

  if (android) {
    // Use Android native vibration
    // Android interface only supports single duration
    if (typeof pattern === "number") {
      android.vibrate(pattern);
    } else if (pattern.length > 0) {
      // For patterns, just use the sum or first value
      android.vibrate(pattern[0]);
    }
  } else if ("vibrate" in navigator) {
    // Fall back to Web Vibration API
    try {
      // @ts-ignore - TypeScript doesn't know about navigator.vibrate
      navigator.vibrate(pattern);
    } catch (e) {
      console.error("Vibration failed:", e);
    }
  }
  // Silently fail if vibration is not supported
};

// Show toast message (native on Android, falls back to web notification)
export const showToast = (message: string): void => {
  const android = getAndroidInterface();

  if (android) {
    android.showToast(message);
  } else {
    // Use web notification as fallback
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Ticket Tracker", { body: message });
    } else {
      // Simple alert fallback if nothing else works
      console.log("[Toast]", message);
    }
  }
};

// Schedule notification - works best on native Android
export const scheduleNotification = (
  title: string,
  message: string,
  delayMinutes = 0,
): void => {
  const android = getAndroidInterface();

  if (android) {
    const timestamp = Date.now() + delayMinutes * 60 * 1000;
    android.setNotification(title, message, timestamp);
  } else if (
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    // Web Notification API as fallback
    setTimeout(
      () => {
        new Notification(title, { body: message });
      },
      delayMinutes * 60 * 1000,
    );
  }
};

// Handle haptic feedback for different interactions
export const hapticFeedback = {
  light: () => vibrate(20),
  medium: () => vibrate(40),
  heavy: () => vibrate(80),
  // For pattern vibrations, we need to check if navigator.vibrate supports patterns
  // For Android interface we'll use sequential vibrations
  success: () => {
    try {
      // @ts-ignore - Handle browser vibration API
      if (navigator.vibrate && typeof navigator.vibrate === "function") {
        // @ts-ignore - Web browsers that support vibration patterns
        navigator.vibrate([40, 30, 80]);
      } else {
        // Simple fallback
        vibrate(80);
      }
    } catch (e) {
      vibrate(80);
    }
  },
  error: () => {
    try {
      // @ts-ignore - Handle browser vibration API
      if (navigator.vibrate && typeof navigator.vibrate === "function") {
        // @ts-ignore - Web browsers that support vibration patterns
        navigator.vibrate([80, 50, 80, 50, 80]);
      } else {
        vibrate(100);
      }
    } catch (e) {
      vibrate(100);
    }
  },
  warning: () => {
    try {
      // @ts-ignore - Handle browser vibration API
      if (navigator.vibrate && typeof navigator.vibrate === "function") {
        // @ts-ignore - Web browsers that support vibration patterns
        navigator.vibrate([50, 30, 50]);
      } else {
        vibrate(60);
      }
    } catch (e) {
      vibrate(60);
    }
  },
};

// Check if app is in online/offline mode
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Listen for online/offline events
export const setupConnectivityListeners = (
  onOnline: () => void,
  onOffline: () => void,
): (() => void) => {
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
};

// Request permission for notifications
export const requestNotificationPermission = async (): Promise<boolean> => {
  if ("Notification" in window) {
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return true;
  }
  return false;
};

// Get device type information
export const getDeviceInfo = (): {
  isAndroid: boolean;
  isMobile: boolean;
  isApp: boolean;
} => {
  const android = getAndroidInterface();
  const userAgent = navigator.userAgent.toLowerCase();

  return {
    isAndroid: /android/.test(userAgent),
    isMobile: /android|iphone|ipad|ipod/.test(userAgent),
    isApp: android !== null,
  };
};
