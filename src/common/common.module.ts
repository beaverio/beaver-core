import { Module } from '@nestjs/common';
import { CacheService, SessionService, CacheWarmupService } from './services';

@Module({
  providers: [
    {
      provide: 'ICacheService',
      useClass: CacheService,
    },
    {
      provide: 'ISessionService',
      useClass: SessionService,
    },
    CacheWarmupService,
  ],
  exports: ['ICacheService', 'ISessionService', CacheWarmupService],
})
export class CommonModule {}
