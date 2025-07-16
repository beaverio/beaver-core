import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ICacheService } from '../interfaces/cache-service.interface';

@Injectable()
export class CacheWarmupService implements OnModuleInit {
  private readonly logger = new Logger(CacheWarmupService.name);

  constructor(
    @Inject('ICacheService')
    private readonly cacheService: ICacheService,
  ) { }

  async onModuleInit() {
    // Only warm cache in production or when explicitly enabled
    const shouldWarmup = process.env.CACHE_WARMUP_ENABLED === 'true';
    if (shouldWarmup) {
      await this.warmupCache();
    }
  }

  /**
   * Warm up the cache with frequently accessed data
   */
  async warmupCache(): Promise<void> {
    this.logger.log('Starting cache warmup...');

    try {
      // Example: Pre-load recently active users or critical user data
      // In a real application, you might want to load:
      // - Most frequently accessed users
      // - System configuration data
      // - Other frequently queried data

      this.logger.log('Cache warmup completed successfully');
    } catch (error) {
      this.logger.error('Cache warmup failed:', error);
      // Don't fail the application startup if cache warmup fails
    }
  }

  /**
   * Manually trigger cache warmup (useful for admin endpoints)
   */
  async triggerWarmup(): Promise<{ success: boolean; message: string }> {
    try {
      await this.warmupCache();
      return { success: true, message: 'Cache warmup completed successfully' };
    } catch (error) {
      this.logger.error('Manual cache warmup failed:', error);
      return { success: false, message: 'Cache warmup failed' };
    }
  }

  /**
   * Clear and reload cache (useful for cache invalidation)
   */
  async reloadCache(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Clearing cache...');
      await this.cacheService.clear();

      this.logger.log('Reloading cache...');
      await this.warmupCache();

      return { success: true, message: 'Cache reloaded successfully' };
    } catch (error) {
      this.logger.error('Cache reload failed:', error);
      return { success: false, message: 'Cache reload failed' };
    }
  }
}