import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Paginated, PaginateQuery } from 'nestjs-paginate';
import { UserRepository } from './user.repository';
import { User } from '../entities/user.entity';
import { ICacheService } from '../../../common/interfaces/cache-service.interface';

// Mock nestjs-paginate
const mockPaginate = jest.fn();
jest.mock('nestjs-paginate', () => ({
  paginate: mockPaginate,
}));

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

  const mockPaginatedResult: Paginated<User> = {
    data: [mockUser],
    meta: {
      itemsPerPage: 50,
      totalItems: 1,
      currentPage: 1,
      totalPages: 1,
      sortBy: [['createdAt', 'DESC']],
      searchBy: [],
      search: '',
      select: [],
      filter: {},
    },
    links: {
      first: '?limit=50',
      current: '?page=1&limit=50',
      last: '?limit=50',
    },
  };

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

    // Create mocked repository
    userRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as unknown as jest.Mocked<Repository<User>>;

    // Create mocked cache service
    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deleteByPattern: jest.fn(),
      isHealthy: jest.fn(),
      getMetrics: jest.fn(),
      clear: jest.fn(),
    } as jest.Mocked<ICacheService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: 'ICacheService',
          useValue: cacheService,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findPaginated', () => {
    it('should return paginated users using nestjs-paginate', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 50,
        sortBy: [['createdAt', 'DESC']],
        searchBy: [],
        search: '',
        filter: {},
        path: '',
      };

      mockPaginate.mockResolvedValue(mockPaginatedResult);

      const result = await repository.findPaginated(query);

      expect(mockPaginate).toHaveBeenCalledWith(
        query,
        userRepository,
        expect.any(Object),
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.itemsPerPage).toBe(50);
    });

    it('should apply default limit when not provided', async () => {
      const query: PaginateQuery = {
        page: 1,
        sortBy: [['createdAt', 'DESC']],
        searchBy: [],
        search: '',
        filter: {},
        path: '',
      };

      mockPaginate.mockResolvedValue(mockPaginatedResult);

      await repository.findPaginated(query);

      // Should call paginate with the query that has limit set to 50 (default)
      expect(mockPaginate).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50 }),
        userRepository,
        expect.any(Object),
      );
    });
  });

  describe('create', () => {
    it('should create and cache a user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      userRepository.save.mockResolvedValue(mockUser);

      const result = await repository.create(createUserDto);

      expect(userRepository.save).toHaveBeenCalledWith(createUserDto);
      expect(cacheService.set).toHaveBeenCalledWith(
        `user:${mockUser.id}`,
        mockUser,
        expect.any(Number),
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should find users with query filters', async () => {
      queryBuilder.getMany.mockResolvedValue(mockUsers);

      const result = await repository.findAll({ email: 'test@example.com' });

      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'user.email = :email',
        {
          email: 'test@example.com',
        },
      );
      expect(result).toEqual(mockUsers);
    });

    it('should find users with id filter', async () => {
      queryBuilder.getMany.mockResolvedValue([mockUser]);

      const result = await repository.findAll({ id: 'test-id' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.id = :id', {
        id: 'test-id',
      });
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('should return cached user if available', async () => {
      cacheService.get.mockResolvedValue(mockUser);

      const result = await repository.findOne({ id: 'test-id' });

      expect(cacheService.get).toHaveBeenCalledWith('user:test-id');
      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should fetch from database and cache if not in cache', async () => {
      cacheService.get.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findOne({ id: 'test-id' });

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(cacheService.set).toHaveBeenCalledWith(
        `user:${mockUser.id}`,
        mockUser,
        expect.any(Number),
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      cacheService.get.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(null);

      const result = await repository.findOne({ id: 'non-existent-id' });

      expect(result).toBeNull();
      expect(cacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and cache user', async () => {
      const updateDto = { email: 'updated@example.com' };
      const updatedUser = { ...mockUser, ...updateDto };

      userRepository.findOneBy.mockResolvedValue(updatedUser);

      const result = await repository.update('test-id', updateDto);

      expect(userRepository.update).toHaveBeenCalledWith('test-id', updateDto);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: 'test-id' });
      expect(cacheService.set).toHaveBeenCalledWith(
        `user:${updatedUser.id}`,
        updatedUser,
        expect.any(Number),
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('caching methods', () => {
    it('should cache entity', async () => {
      await repository.cacheEntity(mockUser);

      expect(cacheService.set).toHaveBeenCalledWith(
        `user:${mockUser.id}`,
        mockUser,
        expect.any(Number),
      );
    });

    it('should get cached entity', async () => {
      cacheService.get.mockResolvedValue(mockUser);

      const result = await repository.getCachedEntity('test-id');

      expect(cacheService.get).toHaveBeenCalledWith('user:test-id');
      expect(result).toEqual(mockUser);
    });

    it('should invalidate entity cache', async () => {
      await repository.invalidateEntity('test-id');

      expect(cacheService.delete).toHaveBeenCalledWith('user:test-id');
    });
  });
});
