/**
 * Query Blocker - Emergency system to prevent infinite API loops
 * This centralized system tracks and blocks excessive queries
 */

class QueryBlocker {
  private blockedEndpoints = new Set<string>();
  private requestCounts = new Map<string, { count: number; timestamp: number }>();
  private readonly RATE_LIMIT_WINDOW = 1000; // 1 second
  private readonly MAX_REQUESTS_PER_WINDOW = 3;

  isBlocked(queryKey: unknown): boolean {
    const endpoint = this.extractEndpoint(queryKey);
    if (!endpoint) return false;

    // Check if endpoint is permanently blocked
    if (this.blockedEndpoints.has(endpoint)) {
      return true;
    }

    // Check rate limiting
    const now = Date.now();
    const current = this.requestCounts.get(endpoint);
    
    if (current) {
      if (now - current.timestamp < this.RATE_LIMIT_WINDOW) {
        if (current.count >= this.MAX_REQUESTS_PER_WINDOW) {
          console.warn(`[QUERY_BLOCKER] Rate limiting ${endpoint}`);
          return true;
        }
        current.count++;
      } else {
        // Reset window
        current.count = 1;
        current.timestamp = now;
      }
    } else {
      this.requestCounts.set(endpoint, { count: 1, timestamp: now });
    }

    return false;
  }

  blockEndpoint(endpoint: string): void {
    this.blockedEndpoints.add(endpoint);
    console.warn(`[QUERY_BLOCKER] Permanently blocking ${endpoint}`);
  }

  unblockEndpoint(endpoint: string): void {
    this.blockedEndpoints.delete(endpoint);
    console.info(`[QUERY_BLOCKER] Unblocked ${endpoint}`);
  }

  private extractEndpoint(queryKey: unknown): string | null {
    if (Array.isArray(queryKey) && queryKey.length > 0) {
      return String(queryKey[0]);
    }
    if (typeof queryKey === 'string') {
      return queryKey;
    }
    return null;
  }

  cleanup(): void {
    const now = Date.now();
    const cutoff = now - (this.RATE_LIMIT_WINDOW * 10);
    
    for (const [key, value] of this.requestCounts.entries()) {
      if (value.timestamp < cutoff) {
        this.requestCounts.delete(key);
      }
    }
  }
}

export const queryBlocker = new QueryBlocker();

// Block the problematic chores endpoint immediately
queryBlocker.blockEndpoint('/api/chores');

// Cleanup old entries periodically
setInterval(() => queryBlocker.cleanup(), 30000);