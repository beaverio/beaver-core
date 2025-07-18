// Mock nestjs-paginate
jest.mock('nestjs-paginate', () => {
  const originalModule = jest.requireActual('nestjs-paginate');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...originalModule,
    paginate: jest.fn(),
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  Paginated,
  PaginateQuery,
  PaginationType,
  paginate,
} from 'nestjs-paginate';
import { UserRepository } from './user.repository';
import { User } from '../entities/user.entity';
import { ICacheService } from '../../../common/interfaces/cache-service.interface';

const mockPaginate = paginate as jest.MockedFunction<typeof paginate>;

describe('UserRepository', () => {
  let repository: UserRepository;
  let userRepository: jest.Mocked<Repository<User>>;
  let cacheService: jest.Mocked<ICacheService>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<User>>;

  // Helper function to create mock User with all required properties
  const createMockUser = (overrides: Partial<User> = {}): User => {
    const timestamp = new Date('2023-01-01T00:00:00Z').getTime();
    const baseUser = {
      id: 'test-id',
      email: 'test@example.com',
      password: 'hashedPassword',
      createdAt: timestamp,
      updatedAt: timestamp,
      setCreationTimestamps: jest.fn(),
      setUpdateTimestamp: jest.fn(),
      ...overrides,
    };

    // Add getter properties with proper typing
    Object.defineProperty(baseUser, 'createdAtDate', {
      get: function (this: { createdAt: number }) {
        return new Date(this.createdAt);
      },
    });
    Object.defineProperty(baseUser, 'updatedAtDate', {
      get: function (this: { updatedAt: number }) {
        return new Date(this.updatedAt);
      },
    });

    return baseUser as User;
  };

  const mockUser = createMockUser();

  const mockUsers: User[] = [
    createMockUser({
      id: 'user-1',
      email: 'user1@example.com',
      createdAt: new Date('2023-01-01T00:00:00Z').getTime(),
      updatedAt: new Date('2023-01-01T00:00:00Z').getTime(),
    }),
    createMockUser({
      id: 'user-2',
      email: 'user2@example.com',
      createdAt: new Date('2023-01-02T00:00:00Z').getTime(),
      updatedAt: new Date('2023-01-02T00:00:00Z').getTime(),
    }),
  ];

  const mockPaginatedResult: Paginated<User> = {
    data: [mockUser],
    meta: {
      itemsPerPage: 50,
      totalItems: 1,
      currentPage: 1,
      totalPages: 1,
      sortBy: [['id', 'ASC']],
      searchBy: [],
      search: '',
      select: [],
      filter: {},
      cursor: 'eyJpZCI6InRlc3QtaWQifQ==', // Base64 encoded cursor
    },
    links: {
      first: '?limit=50',
      current: '?cursor=eyJpZCI6InRlc3QtaWQifQ==&limit=50',
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
      create: jest.fn(),
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
    it('should return paginated users using nestjs-paginate with cursor pagination', async () => {
      const query: PaginateQuery = {
        limit: 50,
        cursor: 'eyJpZCI6InRlc3QtaWQifQ==',
        sortBy: [['id', 'ASC']],
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
        expect.objectContaining({
          paginationType: PaginationType.CURSOR,
          defaultLimit: 50,
          maxLimit: 100,
          sortableColumns: ['createdAt', 'updatedAt', 'id'],
          // defaultSortBy should be removed when query has sortBy parameter
          searchableColumns: ['email'],
          filterableColumns: {
            email: true,
            id: true,
          },
          loadEagerRelations: false,
        }),
      );

      // Verify that defaultSortBy is NOT present when query has sortBy
      const [, , config] = mockPaginate.mock.calls[0];
      expect(config.defaultSortBy).toBeUndefined();

      expect(result.data).toHaveLength(1);
      expect(result.meta.itemsPerPage).toBe(50);
    });

    it('should support filtering by email', async () => {
      const query: PaginateQuery = {
        limit: 50,
        sortBy: [['createdAt', 'DESC']],
        searchBy: [],
        search: '',
        filter: { email: 'test@example.com' },
        path: '',
      };

      mockPaginate.mockResolvedValue(mockPaginatedResult);

      const result = await repository.findPaginated(query);

      expect(mockPaginate).toHaveBeenCalledWith(
        query,
        userRepository,
        expect.objectContaining({
          paginationType: PaginationType.CURSOR,
          filterableColumns: {
            email: true,
            id: true,
          },
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should support filtering by id', async () => {
      const query: PaginateQuery = {
        limit: 50,
        sortBy: [['createdAt', 'DESC']],
        searchBy: [],
        search: '',
        filter: { id: 'test-id' },
        path: '',
      };

      mockPaginate.mockResolvedValue(mockPaginatedResult);

      const result = await repository.findPaginated(query);

      expect(mockPaginate).toHaveBeenCalledWith(
        query,
        userRepository,
        expect.objectContaining({
          paginationType: PaginationType.CURSOR,
          filterableColumns: {
            email: true,
            id: true,
          },
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should support email search', async () => {
      const query: PaginateQuery = {
        limit: 50,
        sortBy: [['createdAt', 'DESC']],
        searchBy: ['email'],
        search: 'test',
        filter: {},
        path: '',
      };

      mockPaginate.mockResolvedValue(mockPaginatedResult);

      const result = await repository.findPaginated(query);

      expect(mockPaginate).toHaveBeenCalledWith(
        query,
        userRepository,
        expect.objectContaining({
          paginationType: PaginationType.CURSOR,
          searchableColumns: ['email'],
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should support sorting by createdAt ASC', async () => {
      const query: PaginateQuery = {
        limit: 50,
        sortBy: [['createdAt', 'ASC']],
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
        expect.objectContaining({
          paginationType: PaginationType.CURSOR,
          sortableColumns: ['createdAt', 'updatedAt', 'id'],
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should support sorting by createdAt DESC', async () => {
      const query: PaginateQuery = {
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
        expect.objectContaining({
          paginationType: PaginationType.CURSOR,
          sortableColumns: ['createdAt', 'updatedAt', 'id'],
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should support sorting by updatedAt ASC', async () => {
      const query: PaginateQuery = {
        limit: 50,
        sortBy: [['updatedAt', 'ASC']],
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
        expect.objectContaining({
          paginationType: PaginationType.CURSOR,
          sortableColumns: ['createdAt', 'updatedAt', 'id'],
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should support sorting by updatedAt DESC', async () => {
      const query: PaginateQuery = {
        limit: 50,
        sortBy: [['updatedAt', 'DESC']],
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
        expect.objectContaining({
          paginationType: PaginationType.CURSOR,
          sortableColumns: ['createdAt', 'updatedAt', 'id'],
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should support sorting by id ASC', async () => {
      const query: PaginateQuery = {
        limit: 50,
        sortBy: [['id', 'ASC']],
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
        expect.objectContaining({
          paginationType: PaginationType.CURSOR,
          sortableColumns: ['createdAt', 'updatedAt', 'id'],
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should support sorting by id DESC', async () => {
      const query: PaginateQuery = {
        limit: 50,
        sortBy: [['id', 'DESC']],
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
        expect.objectContaining({
          paginationType: PaginationType.CURSOR,
          sortableColumns: ['createdAt', 'updatedAt', 'id'],
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should support combined filtering and sorting', async () => {
      const query: PaginateQuery = {
        limit: 25,
        sortBy: [['createdAt', 'DESC']],
        searchBy: ['email'],
        search: 'test',
        filter: { email: 'test@example.com' },
        path: '',
      };

      mockPaginate.mockResolvedValue(mockPaginatedResult);

      const result = await repository.findPaginated(query);

      expect(mockPaginate).toHaveBeenCalledWith(
        query,
        userRepository,
        expect.objectContaining({
          paginationType: PaginationType.CURSOR,
          sortableColumns: ['createdAt', 'updatedAt', 'id'],
          searchableColumns: ['email'],
          filterableColumns: {
            email: true,
            id: true,
          },
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should apply default limit when not provided', async () => {
      const query: PaginateQuery = {
        cursor: 'eyJpZCI6InRlc3QtaWQifQ==',
        sortBy: [['id', 'ASC']],
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
        expect.objectContaining({
          paginationType: PaginationType.CURSOR,
        }),
      );
    });

    it('should work without cursor for initial request', async () => {
      const query: PaginateQuery = {
        limit: 10,
        sortBy: [['id', 'ASC']],
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
        expect.objectContaining({
          paginationType: PaginationType.CURSOR,
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should properly handle query sortBy parameter overriding defaultSortBy config', async () => {
      const queryWithASC: PaginateQuery = {
        limit: 10,
        sortBy: [['createdAt', 'ASC']],
        searchBy: [],
        search: '',
        filter: {},
        path: '',
      };

      const queryWithDESC: PaginateQuery = {
        limit: 10,
        sortBy: [['createdAt', 'DESC']],
        searchBy: [],
        search: '',
        filter: {},
        path: '',
      };

      mockPaginate.mockResolvedValue(mockPaginatedResult);

      await repository.findPaginated(queryWithASC);
      await repository.findPaginated(queryWithDESC);

      // Verify that paginate was called with configs that DO NOT have defaultSortBy
      // since our query has sortBy parameter
      const calls = mockPaginate.mock.calls;

      expect(calls).toHaveLength(2);

      // First call (ASC) should not have defaultSortBy in config
      const [ascQuery, , ascConfig] = calls[0];
      expect(ascQuery.sortBy).toEqual([['createdAt', 'ASC']]);
      expect(ascConfig.defaultSortBy).toBeUndefined();

      // Second call (DESC) should not have defaultSortBy in config
      const [descQuery, , descConfig] = calls[1];
      expect(descQuery.sortBy).toEqual([['createdAt', 'DESC']]);
      expect(descConfig.defaultSortBy).toBeUndefined();

      // Both configs should still have other properties
      expect(ascConfig.paginationType).toBe(PaginationType.CURSOR);
      expect(descConfig.paginationType).toBe(PaginationType.CURSOR);
      expect(ascConfig.sortableColumns).toContain('createdAt');
      expect(descConfig.sortableColumns).toContain('createdAt');
    });

    it('should keep defaultSortBy when no query sortBy is provided', async () => {
      const queryWithoutSort: PaginateQuery = {
        limit: 10,
        searchBy: [],
        search: '',
        filter: {},
        path: '',
      };

      mockPaginate.mockResolvedValue(mockPaginatedResult);

      await repository.findPaginated(queryWithoutSort);

      const [query, , config] = mockPaginate.mock.calls[0];

      // When no sortBy in query, defaultSortBy should be preserved
      expect(query.sortBy).toBeUndefined();
      expect(config.defaultSortBy).toEqual([['createdAt', 'DESC']]);
    });
  });

  describe('create', () => {
    it('should create and cache a user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const createdUser = createMockUser({ email: createUserDto.email });
      userRepository.create.mockReturnValue(createdUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await repository.create(createUserDto);

      expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(userRepository.save).toHaveBeenCalledWith(createdUser);
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
      const updatedUser = createMockUser({ ...mockUser, ...updateDto });

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
