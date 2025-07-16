/**
 * Generic cache service interface for handling caching operations
 * Supports cache-aside pattern with fallback to database operations
 */
export interface ICacheService {
  /**
   * Get a value from cache by key
   * @param key Cache key
   * @returns Promise resolving to cached value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in milliseconds (optional)
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Delete multiple values from cache by pattern
   * @param pattern Key pattern (supports wildcards)
   */
  deleteByPattern(pattern: string): Promise<void>;

  /**
   * Check if cache is healthy and available
   * @returns Promise resolving to true if cache is available
   */
  isHealthy(): Promise<boolean>;

  /**
   * Get cache statistics and metrics
   * @returns Promise resolving to cache metrics
   */
  getMetrics(): Promise<{
    hits: number;
    misses: number;
    keys: number;
    memory: number;
  }>;

  /**
   * Clear all cache entries
   */
  clear(): Promise<void>;
}
