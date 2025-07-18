import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const rateLimitConfig = (
  configService: ConfigService,
): ThrottlerModuleOptions => ({
  throttlers: [
    {
      name: 'default',
      ttl: configService.get<number>('RATE_LIMIT_TTL', 60) * 1000,
      limit: configService.get<number>('RATE_LIMIT_LIMIT', 100),
    },
  ],
});
