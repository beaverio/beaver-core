// Mock nestjs-paginate
jest.mock('nestjs-paginate', () => {
  const originalModule = jest.requireActual('nestjs-paginate');

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
import { UsersRepository } from './users.repository';
import { User } from '../entities/user.entity';
import { ICacheService } from '../../../common/interfaces/cache-service.interface';

const mockPaginate = paginate as jest.MockedFunction<typeof paginate>;

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let usersRepository: jest.Mocked<Repository<User>>;
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
      lastLogin: null,
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
      getOne: jest.fn(),
      getCount: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<User>>;

    // Create mocked repository
    usersRepository = {
      save: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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
        UsersRepository,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: 'ICacheService',
          useValue: cacheService,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);

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
        usersRepository,
        expect.objectContaining({
          paginationType: PaginationType.LIMIT_AND_OFFSET,
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

      // Verify that defaultSortBy is still present with offset pagination
      const [, , config] = mockPaginate.mock.calls[0];
      expect(config.defaultSortBy).toEqual([['createdAt', 'DESC']]);

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
        usersRepository,
        expect.objectContaining({
          paginationType: PaginationType.LIMIT_AND_OFFSET,
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
        usersRepository,
        expect.objectContaining({
          paginationType: PaginationType.LIMIT_AND_OFFSET,
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
        usersRepository,
        expect.objectContaining({
          paginationType: PaginationType.LIMIT_AND_OFFSET,
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
        usersRepository,
        expect.objectContaining({
          paginationType: PaginationType.LIMIT_AND_OFFSET,
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
        usersRepository,
        expect.objectContaining({
          paginationType: PaginationType.LIMIT_AND_OFFSET,
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
        usersRepository,
        expect.objectContaining({
          paginationType: PaginationType.LIMIT_AND_OFFSET,
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
        usersRepository,
        expect.objectContaining({
          paginationType: PaginationType.LIMIT_AND_OFFSET,
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
        usersRepository,
        expect.objectContaining({
          paginationType: PaginationType.LIMIT_AND_OFFSET,
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
        usersRepository,
        expect.objectContaining({
          paginationType: PaginationType.LIMIT_AND_OFFSET,
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
        usersRepository,
        expect.objectContaining({
          paginationType: PaginationType.LIMIT_AND_OFFSET,
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
        usersRepository,
        expect.objectContaining({
          paginationType: PaginationType.LIMIT_AND_OFFSET,
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
        usersRepository,
        expect.objectContaining({
          paginationType: PaginationType.LIMIT_AND_OFFSET,
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

      // First call (ASC) should still have defaultSortBy with offset pagination
      const [ascQuery, , ascConfig] = calls[0];
      expect(ascQuery.sortBy).toEqual([['createdAt', 'ASC']]);
      expect(ascConfig.defaultSortBy).toEqual([['createdAt', 'DESC']]);

      // Second call (DESC) should still have defaultSortBy with offset pagination
      const [descQuery, , descConfig] = calls[1];
      expect(descQuery.sortBy).toEqual([['createdAt', 'DESC']]);
      expect(descConfig.defaultSortBy).toEqual([['createdAt', 'DESC']]);

      // Both configs should still have other properties
      expect(ascConfig.paginationType).toBe(PaginationType.LIMIT_AND_OFFSET);
      expect(descConfig.paginationType).toBe(PaginationType.LIMIT_AND_OFFSET);
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
      usersRepository.create.mockReturnValue(createdUser);
      usersRepository.save.mockResolvedValue(mockUser);

      const result = await repository.create(createUserDto);

      expect(usersRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(usersRepository.save).toHaveBeenCalledWith(createdUser);
      expect(cacheService.set).toHaveBeenCalledWith(
        `user:${mockUser.id}`,
        mockUser,
        expect.any(Number),
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOne', () => {
    it('should return cached user if available', async () => {
      cacheService.get.mockResolvedValue(mockUser);

      const result = await repository.findOne({ id: 'test-id' });

      expect(cacheService.get).toHaveBeenCalledWith('user:test-id');
      expect(usersRepository.createQueryBuilder).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should fetch from database and cache if not in cache', async () => {
      cacheService.get.mockResolvedValue(null);
      usersRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findOne({ id: 'test-id' });

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: ['memberships'],
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
      usersRepository.findOne.mockResolvedValue(null);

      const result = await repository.findOne({ id: 'non-existent-id' });

      expect(result).toBeNull();
      expect(cacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and cache user', async () => {
      const updateDto = { email: 'updated@example.com' };
      const updatedUser = createMockUser({ ...mockUser, ...updateDto });

      usersRepository.findOne.mockResolvedValue(updatedUser);

      const result = await repository.update('test-id', updateDto);

      expect(usersRepository.update).toHaveBeenCalledWith('test-id', updateDto);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: ['memberships'],
      });
      expect(cacheService.set).toHaveBeenCalledWith(
        `user:${updatedUser.id}`,
        updatedUser,
        expect.any(Number),
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete user and invalidate cache', async () => {
      await repository.hardDelete('test-id');

      expect(cacheService.delete).toHaveBeenCalledWith('user:test-id');
      expect(usersRepository.delete).toHaveBeenCalledWith('test-id');
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login and cache user', async () => {
      const updatedUser = createMockUser({
        ...mockUser,
        lastLogin: expect.any(Number),
      });
      usersRepository.findOne.mockResolvedValue(updatedUser);

      const result = await repository.updateLastLogin('test-id');

      expect(usersRepository.update).toHaveBeenCalledWith('test-id', {
        lastLogin: expect.any(Number),
      });
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: ['memberships'],
      });
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
