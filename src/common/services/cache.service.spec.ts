import { Test, TestingModule } from '@nestjs/testing';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: jest.Mocked<Cache>;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get<Cache>(CACHE_MANAGER) as jest.Mocked<Cache>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value on cache hit', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test' };
      cacheManager.get.mockResolvedValue(testValue);

      const result = await service.get(testKey);

      expect(result).toBe(testValue);
      expect(cacheManager.get).toHaveBeenCalledWith(testKey);
    });

    it('should return null on cache miss', async () => {
      const testKey = 'test-key';
      cacheManager.get.mockResolvedValue(undefined);

      const result = await service.get(testKey);

      expect(result).toBeNull();
      expect(cacheManager.get).toHaveBeenCalledWith(testKey);
    });

    it('should handle cache errors gracefully', async () => {
      const testKey = 'test-key';
      cacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.get(testKey);

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in cache', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test' };
      const ttl = 60000;

      await service.set(testKey, testValue, ttl);

      expect(cacheManager.set).toHaveBeenCalledWith(testKey, testValue, ttl);
    });

    it('should handle cache set errors gracefully', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test' };
      cacheManager.set.mockRejectedValue(new Error('Cache error'));

      await expect(service.set(testKey, testValue)).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete value from cache', async () => {
      const testKey = 'test-key';

      await service.delete(testKey);

      expect(cacheManager.del).toHaveBeenCalledWith(testKey);
    });

    it('should handle cache delete errors gracefully', async () => {
      const testKey = 'test-key';
      cacheManager.del.mockRejectedValue(new Error('Cache error'));

      await expect(service.delete(testKey)).resolves.not.toThrow();
    });
  });

  describe('isHealthy', () => {
    it('should return true when cache is healthy', async () => {
      let storedValue: string;

      cacheManager.set.mockImplementation((_key, value) => {
        storedValue = value as string;
        return Promise.resolve(value);
      });

      cacheManager.get.mockImplementation(() => {
        return Promise.resolve(storedValue);
      });

      cacheManager.del.mockResolvedValue(true);

      const result = await service.isHealthy();

      expect(result).toBe(true);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'health_check_test',
        expect.any(String),
        1000,
      );
      expect(cacheManager.get).toHaveBeenCalledWith('health_check_test');
      expect(cacheManager.del).toHaveBeenCalledWith('health_check_test');
    });

    it('should return false when cache is unhealthy', async () => {
      cacheManager.set.mockRejectedValue(new Error('Cache error'));

      const result = await service.isHealthy();

      expect(result).toBe(false);
    });
  });
});
