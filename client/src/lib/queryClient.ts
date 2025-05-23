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

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  // Get auth token from store
  const authStore = JSON.parse(localStorage.getItem('ticket-tracker-auth') || '{}');
  const token = authStore?.state?.token;
  
  // Prepare headers
  const headers: Record<string, string> = { 
    ...(options.headers as Record<string, string> || {})
  };
  
  // Add Content-Type if not FormData and not specified
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add authorization token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  // Prepare body if it's JSON data and not already stringified or FormData
  let body = options.body;
  if (body && 
      headers["Content-Type"] === "application/json" && 
      typeof body !== 'string' && 
      !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }
  
  const res = await fetch(url, {
    ...options,
    headers,
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const text = await res.text();
    if (!text) {
      return undefined;
    }
    try {
      const json = JSON.parse(text);
      if (json && typeof json.success === 'boolean') {
        if (json.success) {
          return json.data !== undefined ? json.data : json;
        }
        const err: any = new Error(json.error?.msg || json.message || "Request failed");
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
  <T,>({ on401: unauthorizedBehavior }: { on401: UnauthorizedBehavior }): QueryFunction<T | null> =>
  async ({ queryKey }) => {
    // Check if we're viewing as a child
    const authStore = JSON.parse(localStorage.getItem('ticket-tracker-auth') || '{}');
    const viewingChildId = authStore?.state?.viewingChildId;
    
    // Build URL with query params if needed
    let url = queryKey[0] as string;
    
    // For child-specific endpoints, add userId param when in child view
    if (viewingChildId && (
      url.includes('/api/goals') || 
      url.includes('/api/transactions') || 
      url.includes('/api/stats')
    )) {
      const separator = url.includes('?') ? '&' : '?';
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

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
