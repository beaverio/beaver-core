import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { ICacheService } from '../interfaces/cache-service.interface';

describe('SessionService', () => {
  let service: SessionService;
  let cacheService: jest.Mocked<ICacheService>;

  beforeEach(async () => {
    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deleteByPattern: jest.fn(),
      isHealthy: jest.fn(),
      getMetrics: jest.fn(),
      clear: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SessionService,
          useFactory: (cacheService: ICacheService) =>
            new SessionService(cacheService),
          inject: ['ICacheService'],
        },
        {
          provide: 'ICacheService',
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    cacheService = module.get<ICacheService>(
      'ICacheService',
    ) as jest.Mocked<ICacheService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('storeSession', () => {
    it('should store session in cache', async () => {
      const userId = 'test-user-id';
      const refreshToken = 'test-refresh-token';
      const expiresAt = new Date(Date.now() + 86400000); // 1 day from now

      cacheService.get.mockResolvedValue([]);

      await service.storeSession(userId, refreshToken, expiresAt);

      expect(cacheService.set).toHaveBeenCalledTimes(2); // session and user sessions list
    });
  });

  describe('isSessionValid', () => {
    it('should return true for valid session', async () => {
      const userId = 'test-user-id';
      const refreshToken = 'test-refresh-token';
      const sessionData = {
        userId,
        refreshToken,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      };

      cacheService.get.mockResolvedValue(sessionData);

      const result = await service.isSessionValid(userId, refreshToken);

      expect(result).toBe(true);
    });

    it('should return false for invalid session', async () => {
      const userId = 'test-user-id';
      const refreshToken = 'test-refresh-token';

      cacheService.get.mockResolvedValue(null);

      const result = await service.isSessionValid(userId, refreshToken);

      expect(result).toBe(false);
    });
  });

  describe('revokeSession', () => {
    it('should revoke specific session', async () => {
      const userId = 'test-user-id';
      const refreshToken = 'test-refresh-token';
      const sessionKey = expect.stringContaining(`session:${userId}:`);

      cacheService.get.mockResolvedValue([sessionKey]);

      await service.revokeSession(userId, refreshToken);

      expect(cacheService.delete).toHaveBeenCalledWith(sessionKey);
    });
  });

  describe('revokeAllUserSessions', () => {
    it('should revoke all user sessions', async () => {
      const userId = 'test-user-id';
      const sessionKeys = ['session:user1:hash1', 'session:user1:hash2'];

      cacheService.get.mockResolvedValue(sessionKeys);

      await service.revokeAllUserSessions(userId);

      expect(cacheService.delete).toHaveBeenCalledTimes(sessionKeys.length + 1); // sessions + user sessions list
    });
  });

  describe('getActiveSessionCount', () => {
    it('should return active session count', async () => {
      const userId = 'test-user-id';
      const sessionKeys = ['session:user1:hash1', 'session:user1:hash2'];

      cacheService.get
        .mockResolvedValueOnce(sessionKeys) // user sessions list
        .mockResolvedValueOnce({ userId }) // first session
        .mockResolvedValueOnce({ userId }); // second session

      const result = await service.getActiveSessionCount(userId);

      expect(result).toBe(2);
    });

    it('should clean up stale session references', async () => {
      const userId = 'test-user-id';
      const sessionKeys = ['session:user1:hash1', 'session:user1:hash2'];

      cacheService.get
        .mockResolvedValueOnce(sessionKeys) // user sessions list
        .mockResolvedValueOnce({ userId }) // first session exists
        .mockResolvedValueOnce(null); // second session doesn't exist

      const result = await service.getActiveSessionCount(userId);

      expect(result).toBe(1);
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining(`user_sessions:${userId}`),
        ['session:user1:hash1'],
      );
    });
  });
});
