/**
 * In-Memory Sliding Window Rate Limiter
 * 
 * Provides rate-limiting protection for sensitive endpoints (Auth, AI, Discovery)
 * against brute-force attacks and abuse.
 * 
 * Note: Suitable for single-instance or containerized Next.js runtimes.
 * For horizontally auto-scaled multi-instance clusters, a shared Redis store
 * would be recommended for global state synchronization.
 */

interface RateLimitRecord {
  timestamps: number[];
}

class RateLimiter {
  private cache: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Periodic garbage collection every 5 minutes to prevent memory growth
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
    // Unref so timer doesn't prevent clean process shutdown
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Evaluates if an identifier has exceeded the allowed limit within the sliding window.
   */
  public check(
    key: string,
    limit: number = 60,
    windowMs: number = 60 * 1000
  ): { success: boolean; limit: number; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = this.cache.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.cache.set(key, record);
    }

    // Filter out timestamps outside the active sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= limit) {
      const oldestInWindow = record.timestamps[0] || now;
      const resetTime = oldestInWindow + windowMs;
      return {
        success: false,
        limit,
        remaining: 0,
        resetTime,
      };
    }

    record.timestamps.push(now);
    const resetTime = now + windowMs;

    return {
      success: true,
      limit,
      remaining: limit - record.timestamps.length,
      resetTime,
    };
  }

  private cleanup() {
    const now = Date.now();
    const maxAge = 15 * 60 * 1000; // 15 mins
    for (const [key, record] of this.cache.entries()) {
      if (record.timestamps.length === 0 || record.timestamps[record.timestamps.length - 1] < now - maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();
