// Helper to extract token from auth response
export function extractToken(responseBody: any): string {
  // Handle both old format (data.token) and new format (data.access_token)
  const token = responseBody?.data?.access_token || responseBody?.data?.token;
  if (!token) {
    throw new Error(`No token found in response: ${JSON.stringify(responseBody)}`);
  }
  return token;
}