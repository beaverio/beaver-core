import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { UserRepository } from './user.repository';
import { User } from '../entities/user.entity';
import { ICacheService } from '../../../common/interfaces/cache-service.interface';

// Mock the paginate function
jest.mock('nestjs-paginate', () => ({
  paginate: jest.fn(),
  PaginationType: {
    TAKE_AND_SKIP: 'take',
    LIMIT_AND_OFFSET: 'limit',
    CURSOR: 'cursor',
  },
}));

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
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        sortBy: [['email', 'ASC'] as [string, string]],
        path: '/users',
      };
      
      const cachedResult = {
        data: [mockUser],
        meta: {
          itemsPerPage: 10,
          totalItems: 1,
          currentPage: 1,
          totalPages: 1,
          sortBy: [['email', 'ASC']],
          searchBy: [],
          search: '',
          select: [],
        },
        links: {
          current: '/users?page=1&limit=10',
        },
      };

      cacheService.get.mockResolvedValue(cachedResult);

      const result = await repository.findAllPaginated(query);

      expect(cacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('user:paginated:'),
      );
      expect(result).toBe(cachedResult);
    });

    it('should fetch from database using nestjs-paginate when cache miss', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        sortBy: [['email', 'ASC'] as [string, string]],
        path: '/users',
      };
      const paginatedResult = {
        data: [mockUser],
        meta: {
          itemsPerPage: 10,
          totalItems: 1,
          currentPage: 1,
          totalPages: 1,
          sortBy: [['email', 'ASC']],
          searchBy: [],
          search: '',
          select: [],
        },
        links: {
          current: '/users?page=1&limit=10',
        },
      };

      cacheService.get.mockResolvedValue(null); // Cache miss
      (paginate as jest.Mock).mockResolvedValue(paginatedResult);

      const result = await repository.findAllPaginated(query);

      expect(paginate).toHaveBeenCalledWith(
        query,
        userRepository,
        expect.objectContaining({
          sortableColumns: ['id', 'email', 'createdAt', 'updatedAt'],
          defaultLimit: 10,
          maxLimit: 100,
        }),
      );
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('user:paginated:'),
        paginatedResult,
        5 * 60 * 1000, // 5 minutes TTL
      );
      expect(result).toBe(paginatedResult);
    });

    it('should handle pagination query with filters', async () => {
      const query: PaginateQuery = {
        page: 2,
        limit: 5,
        filter: { email: 'test@example.com' },
        path: '/users',
      };
      const paginatedResult = {
        data: [mockUser],
        meta: {
          itemsPerPage: 5,
          totalItems: 1,
          currentPage: 2,
          totalPages: 1,
          sortBy: [],
          searchBy: [],
          search: '',
          select: [],
          filter: { email: 'test@example.com' },
        },
        links: {
          current: '/users?page=2&limit=5&filter.email=test@example.com',
        },
      };

      cacheService.get.mockResolvedValue(null);
      (paginate as jest.Mock).mockResolvedValue(paginatedResult);

      const result = await repository.findAllPaginated(query);

      expect(paginate).toHaveBeenCalledWith(
        query,
        userRepository,
        expect.objectContaining({
          filterableColumns: {
            email: true,
            id: true,
          },
        }),
      );
      expect(result).toBe(paginatedResult);
    });
  });

  describe('findAllCursorPaginated', () => {
    it('should return cached cursor-paginated result if available', async () => {
      const query: PaginateQuery = {
        cursor: 'V001671444000000',
        limit: 10,
        sortBy: [['createdAt', 'DESC'] as [string, string]],
        path: '/users',
      };
      
      const cachedResult = {
        data: [mockUser],
        meta: {
          itemsPerPage: 10,
          cursor: 'V001671444000000',
          sortBy: [['createdAt', 'DESC']],
          searchBy: [],
          search: '',
          select: [],
        },
        links: {
          current: '/users?cursor=V001671444000000&limit=10',
          next: '/users?cursor=V001671444000001&limit=10',
        },
      };

      cacheService.get.mockResolvedValue(cachedResult);

      const result = await repository.findAllCursorPaginated(query);

      expect(cacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('user:paginated:'),
      );
      expect(result).toBe(cachedResult);
    });

    it('should fetch from database using cursor-based pagination when cache miss', async () => {
      const query: PaginateQuery = {
        cursor: 'V001671444000000',
        limit: 5,
        sortBy: [['createdAt', 'DESC'] as [string, string]],
        path: '/users',
      };

      const paginatedResult = {
        data: [mockUser],
        meta: {
          itemsPerPage: 5,
          cursor: 'V001671444000000',
          sortBy: [['createdAt', 'DESC']],
          searchBy: [],
          search: '',
          select: [],
        },
        links: {
          current: '/users?cursor=V001671444000000&limit=5',
          next: '/users?cursor=V001671444000001&limit=5',
        },
      };

      cacheService.get.mockResolvedValue(null);
      (paginate as jest.Mock).mockResolvedValue(paginatedResult);

      const result = await repository.findAllCursorPaginated(query);

      expect(paginate).toHaveBeenCalledWith(
        query,
        userRepository,
        expect.objectContaining({
          paginationType: 'cursor', // Ensure cursor-based pagination config is used
          sortableColumns: ['id', 'email', 'createdAt', 'updatedAt'],
        }),
      );
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('user:paginated:'),
        paginatedResult,
        5 * 60 * 1000, // 5 minutes TTL
      );
      expect(result).toBe(paginatedResult);
    });
  });
});
