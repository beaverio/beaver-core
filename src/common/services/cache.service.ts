import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ICacheService } from '../interfaces/cache-service.interface';

@Injectable()
export class CacheService implements ICacheService {
  private readonly logger = new Logger(CacheService.name);
  private metrics = {
    hits: 0,
    misses: 0,
  };

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value !== undefined && value !== null) {
        this.metrics.hits++;
        this.logger.debug(`Cache hit for key: ${key}`);
        return value;
      } else {
        this.metrics.misses++;
        this.logger.debug(`Cache miss for key: ${key}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      this.metrics.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache set for key: ${key}, TTL: ${ttl || 'default'}`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
      // Don't throw error to avoid breaking the application
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache delete for key: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  deleteByPattern(pattern: string): Promise<void> {
    try {
      this.logger.debug(
        `Cache delete by pattern: ${pattern} - pattern deletion not implemented for safety`,
      );
      return Promise.resolve();
    } catch (error) {
      this.logger.error(
        `Cache delete by pattern error for pattern ${pattern}:`,
        error,
      );
      return Promise.resolve();
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Try to set and get a test value
      const testKey = 'health_check_test';
      const testValue = Date.now().toString();

      await this.cacheManager.set(testKey, testValue, 1000); // 1 second TTL
      const retrievedValue = await this.cacheManager.get(testKey);

      const isHealthy = retrievedValue === testValue;

      // Clean up test key
      await this.cacheManager.del(testKey);

      return isHealthy;
    } catch (error) {
      this.logger.error('Cache health check failed:', error);
      return false;
    }
  }

  getMetrics(): Promise<{
    hits: number;
    misses: number;
    keys: number;
    memory: number;
  }> {
    try {
      // Return basic metrics from our internal counters
      // More sophisticated metrics would require Redis-specific implementation
      return Promise.resolve({
        hits: this.metrics.hits,
        misses: this.metrics.misses,
        keys: 0, // Would need Redis DBSIZE command
        memory: 0, // Would need Redis INFO command
      });
    } catch (error) {
      this.logger.error('Error getting cache metrics:', error);
      return Promise.resolve({
        hits: this.metrics.hits,
        misses: this.metrics.misses,
        keys: 0,
        memory: 0,
      });
    }
  }

  clear(): Promise<void> {
    try {
      // Note: cache-manager v5+ doesn't have reset method
      // We would need to implement Redis FLUSHALL if needed
      this.logger.debug('Cache clear - not implemented for safety');
      return Promise.resolve();
    } catch (error) {
      this.logger.error('Cache clear error:', error);
      return Promise.resolve();
    }
  }

  /**
   * Simple pattern matching helper
   * Supports basic wildcard matching with *
   */
  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  }
}
