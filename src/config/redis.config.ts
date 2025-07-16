import { createKeyv } from '@keyv/redis';
import { ConfigService } from '@nestjs/config';

export const redisConfig = (config: ConfigService) => ({
  ttl: 60000,
  stores: [createKeyv(config.getOrThrow<string>('REDIS_URL'))],
});
