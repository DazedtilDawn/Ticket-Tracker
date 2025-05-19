import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Clone the response before reading the body
    const clonedRes = res.clone();
    const text = (await clonedRes.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
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
  
  try {
    const jsonRes = res.clone();
    const json = await jsonRes.json();
    if (json && typeof json.success === "boolean") {
      if (json.success) {
        return json.data;
      }
      const err: any = new Error(json.error?.msg || "Request failed");
      err.code = json.error?.code;
      throw err;
    }
    return json;
  } catch (e) {
    return await res.text();
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
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
