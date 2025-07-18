import { ConfigService } from '@nestjs/config';
import { rateLimitConfig } from './rate-limit.config';

describe('RateLimitConfig', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
  });

  it('should return default configuration when no environment variables are set', () => {
    const config = rateLimitConfig(configService);

    expect(config).toEqual({
      throttlers: [
        {
          name: 'default',
          ttl: 60 * 1000, // 60 seconds in milliseconds
          limit: 100,
        },
      ],
    });
  });

  it('should use environment variables when provided', () => {
    // Mock ConfigService to return specific values
    jest
      .spyOn(configService, 'get')
      .mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'RATE_LIMIT_TTL') return 30;
        if (key === 'RATE_LIMIT_LIMIT') return 50;
        return defaultValue;
      });

    const config = rateLimitConfig(configService);

    expect(config).toEqual({
      throttlers: [
        {
          name: 'default',
          ttl: 30 * 1000, // 30 seconds in milliseconds
          limit: 50,
        },
      ],
    });
  });

  it('should convert TTL from seconds to milliseconds', () => {
    jest
      .spyOn(configService, 'get')
      .mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'RATE_LIMIT_TTL') return 120; // 2 minutes
        if (key === 'RATE_LIMIT_LIMIT') return 200;
        return defaultValue;
      });

    const config = rateLimitConfig(configService);

    expect((config as any).throttlers[0].ttl).toBe(120 * 1000); // Should be in milliseconds
    expect((config as any).throttlers[0].limit).toBe(200);
  });
});
