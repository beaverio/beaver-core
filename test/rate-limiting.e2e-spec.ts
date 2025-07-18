import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Controller, Get } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import * as request from 'supertest';
import { App } from 'supertest/types';

// Simple test controller for rate limiting tests
@Controller('test')
class TestController {
  @Get()
  getTest() {
    return { message: 'test' };
  }
}

describe('Rate Limiting (Integration)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [
            {
              name: 'default',
              ttl: 2 * 1000, // 2 seconds TTL for faster testing
              limit: 3, // 3 requests per 2 seconds for testing
            },
          ],
        }),
      ],
      controllers: [TestController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // Wait for rate limit to reset between tests
    await new Promise((resolve) => setTimeout(resolve, 2500));
  });

  it('should allow requests within rate limit', async () => {
    // Make requests within the limit (3 requests)
    for (let i = 0; i < 3; i++) {
      const response = await request(app.getHttpServer())
        .get('/test')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'test');
    }
  });

  it('should return 429 when rate limit is exceeded', async () => {
    // First, make 3 requests to hit the limit
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer()).get('/test').expect(200);
    }

    // The 4th request should be rate limited
    const response = await request(app.getHttpServer())
      .get('/test')
      .expect(429);

    expect(response.body).toHaveProperty('statusCode', 429);
    expect(response.body).toHaveProperty('message');
  });

  it('should include rate limiting headers', async () => {
    const response = await request(app.getHttpServer())
      .get('/test')
      .expect(200);

    // Check for rate limiting headers
    expect(response.headers['x-ratelimit-limit']).toBeDefined();
    expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    expect(response.headers['x-ratelimit-reset']).toBeDefined();

    // Verify the header values are reasonable
    expect(parseInt(response.headers['x-ratelimit-limit'])).toBe(3);
    expect(
      parseInt(response.headers['x-ratelimit-remaining']),
    ).toBeLessThanOrEqual(3);
  });
});
