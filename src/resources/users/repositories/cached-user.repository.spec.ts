import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CachedUserRepository } from './cached-user.repository';
import { User } from '../entities/user.entity';
import { ICacheService } from '../../../common/interfaces/cache-service.interface';

describe('CachedUserRepository', () => {
  let repository: CachedUserRepository;
  let userRepository: jest.Mocked<Repository<User>>;
  let cacheService: jest.Mocked<ICacheService>;

  const mockUser: User = {
    id: 'test-id',
    email: 'test@example.com',
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUserRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
    };

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
        CachedUserRepository,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: 'ICacheService',
          useValue: mockCacheService,
        },
      ],
    }).compile();

    repository = module.get<CachedUserRepository>(CachedUserRepository);
    userRepository = module.get<Repository<User>>(
      getRepositoryToken(User),
    ) as jest.Mocked<Repository<User>>;
    cacheService = module.get<ICacheService>(
      'ICacheService',
    ) as jest.Mocked<ICacheService>;
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create user and cache it', async () => {
      const createDto = { email: 'test@example.com', password: 'password123' };
      userRepository.save.mockResolvedValue(mockUser);

      const result = await repository.create(createDto);

      expect(userRepository.save).toHaveBeenCalledWith(createDto);
      expect(cacheService.set).toHaveBeenCalledTimes(2); // ID and email cache keys
      expect(result).toBe(mockUser);
    });
  });

  describe('findOne', () => {
    it('should return cached user when cache hit', async () => {
      const query = { id: 'test-id' };
      cacheService.get.mockResolvedValue(mockUser);

      const result = await repository.findOne(query);

      expect(cacheService.get).toHaveBeenCalledWith('user:id:test-id');
      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });

    it('should fetch from database on cache miss and cache result', async () => {
      const query = { id: 'test-id' };
      cacheService.get.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findOne(query);

      expect(cacheService.get).toHaveBeenCalledWith('user:id:test-id');
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: query });
      expect(cacheService.set).toHaveBeenCalledTimes(2); // ID and email cache keys
      expect(result).toBe(mockUser);
    });

    it('should handle cache by email', async () => {
      const query = { email: 'test@example.com' };
      cacheService.get.mockResolvedValue(mockUser);

      const result = await repository.findOne(query);

      expect(cacheService.get).toHaveBeenCalledWith(
        'user:email:test@example.com',
      );
      expect(result).toBe(mockUser);
    });

    it('should return null when user not found', async () => {
      const query = { id: 'test-id' };
      cacheService.get.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(null);

      const result = await repository.findOne(query);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user, invalidate cache, and cache updated user', async () => {
      const updateDto = { email: 'updated@example.com' };
      const updatedUser = { ...mockUser, ...updateDto };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await repository.update('test-id', updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(userRepository.merge).toHaveBeenCalledWith(mockUser, updateDto);
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(cacheService.delete).toHaveBeenCalledTimes(2); // Invalidate old cache
      expect(cacheService.set).toHaveBeenCalledTimes(2); // Cache updated user
      expect(result).toBe(updatedUser);
    });

    it('should throw error when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(repository.update('test-id', {})).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('findAll', () => {
    it('should fetch users from database and cache them individually', async () => {
      const query = { email: 'test@example.com' };
      const users = [mockUser];
      userRepository.find.mockResolvedValue(users);

      const result = await repository.findAll(query);

      expect(userRepository.find).toHaveBeenCalledWith({ where: query });
      expect(cacheService.set).toHaveBeenCalledTimes(2); // ID and email cache keys for each user
      expect(result).toBe(users);
    });
  });
});
