import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { UserRepository } from './user.repository';
import { User } from '../entities/user.entity';
import { ICacheService } from '../../../common/interfaces/cache-service.interface';
import { ICursorPaginationOptions } from '../../../common/interfaces/cursor-pagination.interface';

describe('UserRepository', () => {
  let repository: UserRepository;
  let userRepository: jest.Mocked<Repository<User>>;
  let cacheService: jest.Mocked<ICacheService>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<User>>;

  const mockUser: User = {
    id: 'test-id',
    email: 'test@example.com',
    password: 'hashedPassword',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  };

  const mockUsers: User[] = [
    {
      id: 'user-1',
      email: 'user1@example.com',
      password: 'hashedPassword',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z'),
    },
    {
      id: 'user-2',
      email: 'user2@example.com',
      password: 'hashedPassword',
      createdAt: new Date('2023-01-02T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  ];

  beforeEach(async () => {
    // Create mocked query builder
    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<User>>;

    const mockUserRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
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
    userRepository = module.get(getRepositoryToken(User));
    cacheService = module.get('ICacheService');
  });

  describe('findAllCursor', () => {
    it('should return paginated results with cursor', async () => {
      const options: ICursorPaginationOptions = {
        limit: 2,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };

      cacheService.get.mockResolvedValue(null); // Cache miss
      queryBuilder.getMany.mockResolvedValue(mockUsers);
      queryBuilder.getCount.mockResolvedValue(1); // For hasPrevious check

      const result = await repository.findAllCursor(options);

      expect(result.data).toEqual(mockUsers);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrevious).toBe(true);
      expect(result.nextCursor).toBeUndefined();
      expect(result.prevCursor).toBeDefined();
      expect(queryBuilder.select).toHaveBeenCalledWith([
        'user.id',
        'user.email',
        'user.createdAt',
        'user.updatedAt',
      ]);
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'user.createdAt',
        'DESC',
      );
      expect(queryBuilder.limit).toHaveBeenCalledWith(3); // limit + 1
    });

    it('should apply cursor filtering for next page', async () => {
      const cursor = Buffer.from('2023-01-01T00:00:00.000Z').toString('base64');
      const options: ICursorPaginationOptions = {
        limit: 2,
        cursor,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };

      cacheService.get.mockResolvedValue(null);
      queryBuilder.getMany.mockResolvedValue([mockUsers[1]]); // Only second user
      queryBuilder.getCount.mockResolvedValue(0);

      await repository.findAllCursor(options);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'user.createdAt < :cursorValue',
        {
          cursorValue: '2023-01-01T00:00:00.000Z',
        },
      );
    });

    it('should apply cursor filtering for ASC order', async () => {
      const cursor = Buffer.from('2023-01-01T00:00:00.000Z').toString('base64');
      const options: ICursorPaginationOptions = {
        limit: 2,
        cursor,
        sortBy: 'createdAt',
        sortOrder: 'ASC',
      };

      cacheService.get.mockResolvedValue(null);
      queryBuilder.getMany.mockResolvedValue([mockUsers[1]]);
      queryBuilder.getCount.mockResolvedValue(0);

      await repository.findAllCursor(options);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'user.createdAt > :cursorValue',
        {
          cursorValue: '2023-01-01T00:00:00.000Z',
        },
      );
    });

    it('should return cached result when available', async () => {
      const options: ICursorPaginationOptions = {
        limit: 2,
      };

      const cachedResult = {
        data: mockUsers,
        nextCursor: 'cached-cursor',
        prevCursor: undefined,
        hasNext: true,
        hasPrevious: false,
      };

      cacheService.get.mockResolvedValue(cachedResult);

      const result = await repository.findAllCursor(options);

      expect(result).toEqual(cachedResult);
      expect(queryBuilder.getMany).not.toHaveBeenCalled();
    });

    it('should apply where conditions', async () => {
      const options: ICursorPaginationOptions = {
        limit: 2,
      };
      const where = { email: 'test@example.com' };

      cacheService.get.mockResolvedValue(null);
      queryBuilder.getMany.mockResolvedValue([mockUser]);
      queryBuilder.getCount.mockResolvedValue(0);

      await repository.findAllCursor(options, where);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'user.email = :email',
        { email: 'test@example.com' },
      );
    });

    it('should handle empty results', async () => {
      const options: ICursorPaginationOptions = {
        limit: 2,
      };

      cacheService.get.mockResolvedValue(null);
      queryBuilder.getMany.mockResolvedValue([]);

      const result = await repository.findAllCursor(options);

      expect(result.data).toEqual([]);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrevious).toBe(false);
      expect(result.nextCursor).toBeUndefined();
      expect(result.prevCursor).toBeUndefined();
    });

    it('should use default values for invalid sort options', async () => {
      const options: ICursorPaginationOptions = {
        limit: 2,
        sortBy: 'invalidColumn', // Invalid column
      };

      cacheService.get.mockResolvedValue(null);
      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAllCursor(options);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'user.createdAt',
        'DESC',
      ); // Falls back to default
    });

    it('should respect maximum limit', async () => {
      const options: ICursorPaginationOptions = {
        limit: 200, // Exceeds max limit of 100
      };

      cacheService.get.mockResolvedValue(null);
      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAllCursor(options);

      expect(queryBuilder.limit).toHaveBeenCalledWith(101); // 100 + 1
    });
  });

  describe('create', () => {
    it('should create and cache a user', async () => {
      const createDto = { email: 'test@example.com', password: 'password' };
      userRepository.save.mockResolvedValue(mockUser);
      cacheService.set.mockResolvedValue();

      const result = await repository.create(createDto);

      expect(userRepository.save).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockUser);
      expect(cacheService.set).toHaveBeenCalledTimes(2); // By ID and email
    });
  });

  describe('findOne', () => {
    it('should return cached user when available', async () => {
      const query = { id: 'test-id' };
      cacheService.get.mockResolvedValue(mockUser);

      const result = await repository.findOne(query);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when not cached', async () => {
      const query = { id: 'test-id' };
      cacheService.get.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findOne(query);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: query });
      expect(result).toEqual(mockUser);
      expect(cacheService.set).toHaveBeenCalledTimes(2); // By ID and email
    });
  });

  describe('update', () => {
    it('should update and re-cache user', async () => {
      const updateDto = { email: 'updated@example.com' };
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({ ...mockUser, ...updateDto });
      cacheService.delete.mockResolvedValue();
      cacheService.set.mockResolvedValue();

      await repository.update('test-id', updateDto);

      expect(userRepository.merge).toHaveBeenCalledWith(mockUser, updateDto);
      expect(cacheService.delete).toHaveBeenCalledTimes(2); // Invalidate old cache
      expect(cacheService.set).toHaveBeenCalledTimes(2); // Cache updated user
    });

    it('should throw error when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(repository.update('non-existent-id', {})).rejects.toThrow(
        'User not found',
      );
    });
  });
});
