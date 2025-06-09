import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Clone the response before reading the body
    const clonedRes = res.clone();
    const text = (await clonedRes.text()) || res.statusText;
    const err: any = new Error(`${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }
}

// Track if we're refreshing the token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

async function refreshAccessToken(): Promise<string> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const json = await res.json();
    const newToken = json.data?.access_token || json.data?.token;
    
    if (!newToken) {
      throw new Error('No token in refresh response');
    }
    
    // Update auth store with new token
    const authStore = JSON.parse(
      localStorage.getItem("ticket-tracker-auth") || "{}",
    );
    if (authStore.state) {
      authStore.state.token = newToken;
      localStorage.setItem("ticket-tracker-auth", JSON.stringify(authStore));
    }
    
    return newToken;
  } catch (error) {
    // Clear auth state on refresh failure
    localStorage.removeItem("ticket-tracker-auth");
    throw error;
  }
}

export async function apiRequest(
  url: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<any> {
  // Get auth token from store
  const authStore = JSON.parse(
    localStorage.getItem("ticket-tracker-auth") || "{}",
  );
  const token = authStore?.state?.token;

  // Prepare headers
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add Content-Type if not FormData and not specified
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  // Add authorization token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Prepare body if it's JSON data and not already stringified or FormData
  let body = options.body;
  if (
    body &&
    headers["Content-Type"] === "application/json" &&
    typeof body !== "string" &&
    !(body instanceof FormData)
  ) {
    body = JSON.stringify(body);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body,
    credentials: "include",
  });

  // Handle 401 and token refresh
  if (res.status === 401 && !isRetry) {
    if (isRefreshing) {
      // Wait for the ongoing refresh
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        // Retry with new token
        return apiRequest(url, options, true);
      });
    }
    
    isRefreshing = true;
    
    try {
      const newToken = await refreshAccessToken();
      processQueue(null, newToken);
      
      // Retry original request with new token
      return apiRequest(url, options, true);
    } catch (error) {
      processQueue(error, null);
      throw error;
    } finally {
      isRefreshing = false;
    }
  }

  await throwIfResNotOk(res);

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const text = await res.text();
    if (!text) {
      return undefined;
    }
    try {
      const json = JSON.parse(text);
      if (json && typeof json.success === "boolean") {
        if (json.success) {
          return json.data !== undefined ? json.data : json;
        }
        const err: any = new Error(
          json.error?.msg || json.message || "Request failed",
        );
        err.code = json.error?.code;
        err.status = res.status;
        throw err;
      }
      return json;
    } catch (e) {
      console.error("Failed to parse JSON response:", text, e);
      throw new Error("Failed to parse JSON response from server.");
    }
  }

  return await res.text();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn =
  <T>({
    on401,
  }: {
    on401: UnauthorizedBehavior;
  }): QueryFunction<T | null> =>
  async ({ queryKey }) => {
    // Check if we're viewing as a child
    const authStore = JSON.parse(
      localStorage.getItem("ticket-tracker-auth") || "{}",
    );
    const viewingChildId = authStore?.state?.viewingChildId;

    // Build URL with query params if needed
    let url = queryKey[0] as string;

    // For child-specific endpoints, add userId param when in child view
    if (
      viewingChildId &&
      (url.includes("/api/goals") ||
        url.includes("/api/transactions") ||
        url.includes("/api/stats"))
    ) {
      const separator = url.includes("?") ? "&" : "?";
      url = `${url}${separator}userId=${viewingChildId}`;
    }

    // Get token from auth store
    const token = authStore?.state?.token;

    // Prepare headers
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    // Handle 401 with token refresh
    if (res.status === 401) {
      if (on401 === "returnNull") {
        return null;
      }
      
      // Try to refresh token
      try {
        const newToken = await refreshAccessToken();
        
        // Retry with new token
        headers["Authorization"] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, {
          headers,
          credentials: "include",
        });
        
        if (retryRes.status === 401) {
          throw new Error("Unauthorized after refresh");
        }
        
        await throwIfResNotOk(retryRes);
        const jsonRes = retryRes.clone();
        const json = await jsonRes.json();
        if (json && typeof json.success === "boolean") {
          if (json.success) {
            return json.data as T;
          }
          const err: any = new Error(json.error?.msg || "Request failed");
          err.code = json.error?.code;
          throw err;
        }
        return json as T;
      } catch (error) {
        if (on401 === "returnNull") {
          return null;
        }
        throw error;
      }
    }

    await throwIfResNotOk(res);
    const jsonRes = res.clone();
    const json = await jsonRes.json();
    if (json && typeof json.success === "boolean") {
      if (json.success) {
        return json.data as T;
      }
      const err: any = new Error(json.error?.msg || "Request failed");
      err.code = json.error?.code;
      throw err;
    }
    return json as T;
  };

// Create a request cache to limit frequency of API calls
const requestCache: Record<string, { timestamp: number; data: any }> = {};

// Enhanced query function with local caching
// Fix Type issues by ensuring we don't return null for StatsResponse
export const getCachedQueryFn =
  <T>({
    on401,
    cacheDuration = 0,
  }: {
    on401: UnauthorizedBehavior;
    cacheDuration?: number;
  }): QueryFunction<T> =>
  async ({ queryKey }) => {
    // Build URL with query params if needed
    let url = queryKey[0] as string;
    const cacheKey = Array.isArray(queryKey)
      ? queryKey.join("|")
      : String(queryKey);

    // Check if we're viewing as a child
    const authStore = JSON.parse(
      localStorage.getItem("ticket-tracker-auth") || "{}",
    );
    const viewingChildId = authStore?.state?.viewingChildId;

    // For child-specific endpoints, add userId param when in child view
    if (
      viewingChildId &&
      (url.includes("/api/goals") ||
        url.includes("/api/transactions") ||
        url.includes("/api/stats"))
    ) {
      const separator = url.includes("?") ? "&" : "?";
      url = `${url}${separator}userId=${viewingChildId}`;
    }

    // Check if we have a cached response that's still valid
    if (cacheDuration > 0 && requestCache[cacheKey]) {
      const cachedData = requestCache[cacheKey];
      const now = Date.now();
      if (now - cachedData.timestamp < cacheDuration) {
        console.log(
          `Using cached data for ${url} (age: ${(now - cachedData.timestamp) / 1000}s)`,
        );
        return cachedData.data as T;
      }
    }

    // Get token from auth store
    const token = authStore?.state?.token;

    // Prepare headers
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (res.status === 401) {
      // Try to refresh token
      try {
        const newToken = await refreshAccessToken();
        
        // Retry with new token
        headers["Authorization"] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, {
          headers,
          credentials: "include",
        });
        
        if (retryRes.status === 401) {
          throw new Error("Unauthorized after refresh");
        }
        
        await throwIfResNotOk(retryRes);
        const jsonRes = retryRes.clone();
        const json = await jsonRes.json();

        if (json && typeof json.success === "boolean") {
          if (json.success) {
            // Store in cache if caching is enabled
            if (cacheDuration > 0) {
              requestCache[cacheKey] = { timestamp: Date.now(), data: json.data };
            }
            return json.data as T;
          }
          const err: any = new Error(json.error?.msg || "Request failed");
          err.code = json.error?.code;
          throw err;
        }

        // Store in cache if caching is enabled
        if (cacheDuration > 0) {
          requestCache[cacheKey] = { timestamp: Date.now(), data: json };
        }
        return json as T;
      } catch (error) {
        throw error;
      }
    }

    await throwIfResNotOk(res);
    const jsonRes = res.clone();
    const json = await jsonRes.json();

    if (json && typeof json.success === "boolean") {
      if (json.success) {
        // Store in cache if caching is enabled
        if (cacheDuration > 0) {
          requestCache[cacheKey] = { timestamp: Date.now(), data: json.data };
        }
        return json.data as T;
      }
      const err: any = new Error(json.error?.msg || "Request failed");
      err.code = json.error?.code;
      throw err;
    }

    // Store in cache if caching is enabled
    if (cacheDuration > 0) {
      requestCache[cacheKey] = { timestamp: Date.now(), data: json };
    }
    return json as T;
  };

// Configure the global query client with fixed architecture
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 600000, // 10 minute stale time
      gcTime: 20 * 60 * 1000, // Keep data in cache for 20 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Create API-specific cache configurations to apply in components
export const apiCacheConfigs = {
  // Static data that rarely changes
  lowFrequency: {
    queryFn: getCachedQueryFn({ on401: "throw", cacheDuration: 120000 }), // 2 minute cache
    staleTime: 120000,
    refetchInterval: 300000, // 5 minute refresh
  },

  // Data that changes occasionally
  mediumFrequency: {
    queryFn: getCachedQueryFn({ on401: "throw", cacheDuration: 30000 }), // 30 second cache
    staleTime: 60000, // 1 minute stale time
    refetchInterval: 120000, // 2 minute refresh
  },

  // Data that changes frequently
  highFrequency: {
    queryFn: getCachedQueryFn({ on401: "throw", cacheDuration: 5000 }), // 5 second cache
    staleTime: 10000, // 10 second stale time
    refetchInterval: 60000, // 1 minute refresh
  },
};
