import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from './user.repository';
import { User } from '../entities/user.entity';
import { ICacheService } from '../../../common/interfaces/cache-service.interface';

describe('UserRepository', () => {
  let repository: UserRepository;
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
    const mockQueryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    const mockUserRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
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
        UserRepository,
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

    repository = module.get<UserRepository>(UserRepository);
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

  describe('findAllPaginated', () => {
    it('should return cached paginated result if available', async () => {
      const options = {
        page: 1,
        limit: 10,
        sortBy: 'email',
        sortOrder: 'ASC' as const,
      };
      const where = { email: 'test@example.com' };
      const cachedResult = {
        data: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      cacheService.get.mockResolvedValue(cachedResult);

      const result = await repository.findAllPaginated(options, where);

      expect(cacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('user:paginated:1:10:email:ASC:'),
      );
      expect(result).toBe(cachedResult);
      expect(userRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache result when cache miss', async () => {
      const options = {
        page: 1,
        limit: 10,
        sortBy: 'email',
        sortOrder: 'ASC' as const,
      };
      const users = [mockUser];
      const total = 1;

      cacheService.get.mockResolvedValue(null); // Cache miss

      // Set up the query builder mock to return the expected result
      const mockQueryBuilder = userRepository.createQueryBuilder();
      (mockQueryBuilder.getManyAndCount as jest.Mock).mockResolvedValue([
        users,
        total,
      ]);

      const result = await repository.findAllPaginated(options);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'user.email',
        'ASC',
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled(); // Cache the result
      expect(result).toEqual({
        data: users,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
    });

    it('should apply where conditions when provided', async () => {
      const options = { page: 1, limit: 10 };
      const where = { id: 'test-id', email: 'test@example.com' };

      cacheService.get.mockResolvedValue(null);
      const mockQueryBuilder = userRepository.createQueryBuilder();
      (mockQueryBuilder.getManyAndCount as jest.Mock).mockResolvedValue([
        [],
        0,
      ]);

      await repository.findAllPaginated(options, where);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.id = :id', {
        id: 'test-id',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.email = :email',
        { email: 'test@example.com' },
      );
    });

    it('should use default sorting when no sortBy is provided', async () => {
      const options = { page: 1, limit: 10 };

      cacheService.get.mockResolvedValue(null);
      const mockQueryBuilder = userRepository.createQueryBuilder();
      (mockQueryBuilder.getManyAndCount as jest.Mock).mockResolvedValue([
        [],
        0,
      ]);

      await repository.findAllPaginated(options);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'user.createdAt',
        'DESC',
      );
    });

    it('should calculate pagination metadata correctly', async () => {
      const options = { page: 2, limit: 5 };
      const users = [mockUser];
      const total = 12;

      cacheService.get.mockResolvedValue(null);
      const mockQueryBuilder = userRepository.createQueryBuilder();
      (mockQueryBuilder.getManyAndCount as jest.Mock).mockResolvedValue([
        users,
        total,
      ]);

      const result = await repository.findAllPaginated(options);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5); // (2-1) * 5
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(result.totalPages).toBe(3); // Math.ceil(12/5)
      expect(result.hasNext).toBe(true); // page 2 < 3 total pages
      expect(result.hasPrevious).toBe(true); // page 2 > 1
    });
  });
});
