import { Controller, Get, Post, Inject } from '@nestjs/common';
import { ICacheService } from '../common/interfaces/cache-service.interface';
import { CacheWarmupService } from '../common/services/cache-warmup.service';

@Controller('health')
export class HealthController {
  constructor(
    @Inject('ICacheService')
    private readonly cacheService: ICacheService,
    private readonly cacheWarmupService: CacheWarmupService,
  ) {}

  @Get()
  async health() {
    const cacheHealthy = await this.cacheService.isHealthy();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        cache: cacheHealthy ? 'healthy' : 'unhealthy',
      },
    };
  }

  @Get('cache')
  async cacheHealth() {
    const isHealthy = await this.cacheService.isHealthy();
    const metrics = await this.cacheService.getMetrics();

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      metrics,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('cache/metrics')
  async cacheMetrics() {
    const metrics = await this.cacheService.getMetrics();

    return {
      ...metrics,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('cache/warmup')
  async warmupCache() {
    return await this.cacheWarmupService.triggerWarmup();
  }

  @Post('cache/reload')
  async reloadCache() {
    return await this.cacheWarmupService.reloadCache();
  }
}
