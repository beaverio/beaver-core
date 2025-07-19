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
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ICacheService } from '../../../common/interfaces/cache-service.interface';
import { Account } from '../entities/account.entity';
import { AccountsRepository } from './accounts.repository';

const mockPaginate = paginate as jest.MockedFunction<typeof paginate>;

describe('AccountsRepository', () => {
  let repository: AccountsRepository;
  let accountsRepository: jest.Mocked<Repository<Account>>;
  let cacheService: jest.Mocked<ICacheService>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<Account>>;

  // Helper function to create mock Account with all required properties
  const createMockAccount = (overrides: Partial<Account> = {}): Account => {
    const timestamp = new Date('2023-01-01T00:00:00Z').getTime();
    const baseAccount = {
      id: 'test-id',
      name: 'Test Account',
      createdAt: timestamp,
      updatedAt: timestamp,
      setCreationTimestamps: jest.fn(),
      setUpdateTimestamp: jest.fn(),
      ...overrides,
    };

    // Add getter properties with proper typing
    Object.defineProperty(baseAccount, 'createdAtDate', {
      get: function (this: { createdAt: number }) {
        return new Date(this.createdAt);
      },
    });
    Object.defineProperty(baseAccount, 'updatedAtDate', {
      get: function (this: { updatedAt: number }) {
        return new Date(this.updatedAt);
      },
    });

    return baseAccount as Account;
  };

  const mockAccount = createMockAccount();

  const mockPaginatedResult: Paginated<Account> = {
    data: [mockAccount],
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
      first: '',
      previous: '',
      current: '',
      next: '',
      last: '',
    },
  };

  beforeEach(async () => {
    // Create mocks
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    } as any;

    accountsRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      manager: {
        transaction: jest.fn(),
      },
    } as any;

    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsRepository,
        {
          provide: getRepositoryToken(Account),
          useValue: accountsRepository,
        },
        {
          provide: 'ICacheService',
          useValue: cacheService,
        },
      ],
    }).compile();

    repository = module.get<AccountsRepository>(AccountsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save an account', async () => {
      const createData = { name: 'New Account' };
      const createdAccount = createMockAccount(createData);

      accountsRepository.create.mockReturnValue(createdAccount);
      accountsRepository.save.mockResolvedValue(createdAccount);

      const result = await repository.create(createData);

      expect(accountsRepository.create).toHaveBeenCalledWith(createData);
      expect(accountsRepository.save).toHaveBeenCalledWith(createdAccount);
      expect(result).toEqual(createdAccount);
    });

    it('should handle database errors during creation', async () => {
      const createData = { name: 'New Account' };
      const createdAccount = createMockAccount(createData);

      accountsRepository.create.mockReturnValue(createdAccount);
      accountsRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(repository.create(createData)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findAll', () => {
    it('should return all accounts using findPaginated', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 50,
        path: '',
      };

      mockPaginate.mockResolvedValue(mockPaginatedResult);

      const result = await repository.findPaginated(query);

      expect(mockPaginate).toHaveBeenCalled();
      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe('findOne', () => {
    it('should find an account by criteria', async () => {
      const criteria = { id: 'test-id' };
      accountsRepository.findOne.mockResolvedValue(mockAccount);

      const result = await repository.findOne(criteria);

      expect(accountsRepository.findOne).toHaveBeenCalledWith({
        where: criteria,
      });
      expect(result).toEqual(mockAccount);
    });

    it('should return null when account not found', async () => {
      const criteria = { id: 'nonexistent' };
      accountsRepository.findOne.mockResolvedValue(null);

      const result = await repository.findOne(criteria);

      expect(result).toBeNull();
    });

    it('should return cached account when available', async () => {
      const criteria = { id: 'test-id' };
      cacheService.get.mockResolvedValue(mockAccount);

      const result = await repository.findOne(criteria);

      expect(cacheService.get).toHaveBeenCalledWith('account:test-id');
      expect(result).toEqual(mockAccount);
      expect(accountsRepository.findOne).not.toHaveBeenCalled();
    });

    it('should cache account when not in cache', async () => {
      const criteria = { id: 'test-id' };
      cacheService.get.mockResolvedValue(null);
      accountsRepository.findOne.mockResolvedValue(mockAccount);

      const result = await repository.findOne(criteria);

      expect(cacheService.get).toHaveBeenCalledWith('account:test-id');
      expect(accountsRepository.findOne).toHaveBeenCalledWith({
        where: criteria,
      });
      expect(cacheService.set).toHaveBeenCalledWith(
        'account:test-id',
        mockAccount,
        repository['CACHE_TTL'],
      );
      expect(result).toEqual(mockAccount);
    });
  });

  describe('update', () => {
    it('should update an account', async () => {
      const id = 'test-id';
      const updateData = { name: 'Updated Account' };
      const updatedAccount = createMockAccount({
        id,
        name: 'Updated Account',
      });

      accountsRepository.update.mockResolvedValue({ affected: 1 } as any);
      accountsRepository.findOneBy.mockResolvedValue(updatedAccount);

      const result = await repository.update(id, updateData);

      expect(accountsRepository.update).toHaveBeenCalledWith(id, updateData);
      expect(accountsRepository.findOneBy).toHaveBeenCalledWith({ id });
      expect(result).toEqual(updatedAccount);
    });

    it('should cache account after update', async () => {
      const id = 'test-id';
      const updateData = { name: 'Updated Account' };
      const updatedAccount = createMockAccount({
        id,
        name: 'Updated Account',
      });

      accountsRepository.update.mockResolvedValue({ affected: 1 } as any);
      accountsRepository.findOneBy.mockResolvedValue(updatedAccount);

      await repository.update(id, updateData);

      expect(cacheService.set).toHaveBeenCalledWith(
        `account:${id}`,
        updatedAccount,
        repository['CACHE_TTL'],
      );
    });

    it('should handle update failures', async () => {
      const id = 'test-id';
      const updateData = { name: 'Updated Account' };

      accountsRepository.update.mockRejectedValue(new Error('Update failed'));

      await expect(repository.update(id, updateData)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('hardDelete', () => {
    it('should delete an account', async () => {
      const id = 'test-id';

      accountsRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await repository.hardDelete(id);

      expect(accountsRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should invalidate cache after deletion', async () => {
      const id = 'test-id';

      accountsRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await repository.hardDelete(id);

      expect(cacheService.delete).toHaveBeenCalledWith(`account:${id}`);
    });

    it('should handle deletion failures', async () => {
      const id = 'test-id';

      accountsRepository.delete.mockRejectedValue(new Error('Deletion failed'));

      await expect(repository.hardDelete(id)).rejects.toThrow(
        'Deletion failed',
      );
    });
  });

  describe('findPaginated', () => {
    it('should return paginated accounts', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '',
      };

      mockPaginate.mockResolvedValue(mockPaginatedResult);

      const result = await repository.findPaginated(query);

      expect(mockPaginate).toHaveBeenCalledWith(
        query,
        accountsRepository,
        expect.objectContaining({
          sortableColumns: ['createdAt', 'updatedAt', 'id'],
          searchableColumns: ['name'],
          defaultSortBy: [['createdAt', 'DESC']],
          maxLimit: 100,
          defaultLimit: 50,
        }),
      );
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle pagination with search', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '',
        search: 'Test',
      };

      mockPaginate.mockResolvedValue(mockPaginatedResult);

      const result = await repository.findPaginated(query);

      expect(mockPaginate).toHaveBeenCalledWith(
        query,
        accountsRepository,
        expect.objectContaining({
          searchableColumns: ['name'],
        }),
      );
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle pagination with filters', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '',
        filter: {
          name: 'Test Account',
        },
      };

      mockPaginate.mockResolvedValue(mockPaginatedResult);

      const result = await repository.findPaginated(query);

      expect(mockPaginate).toHaveBeenCalledWith(
        query,
        accountsRepository,
        expect.objectContaining({
          filterableColumns: {
            id: true,
          },
        }),
      );
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle custom sorting', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '',
        sortBy: [['name', 'ASC']],
      };

      mockPaginate.mockResolvedValue(mockPaginatedResult);

      const result = await repository.findPaginated(query);

      expect(mockPaginate).toHaveBeenCalledWith(
        query,
        accountsRepository,
        expect.objectContaining({
          sortableColumns: ['createdAt', 'updatedAt', 'id'],
        }),
      );
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle pagination errors', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '',
      };

      mockPaginate.mockRejectedValue(new Error('Pagination error'));

      await expect(repository.findPaginated(query)).rejects.toThrow(
        'Pagination error',
      );
    });
  });

  describe('cache operations', () => {
    it('should handle cache errors gracefully', async () => {
      const criteria = { id: 'test-id' };
      cacheService.get.mockResolvedValue(null); // Simulate cache miss instead of error
      accountsRepository.findOne.mockResolvedValue(mockAccount);

      const result = await repository.findOne(criteria);

      expect(result).toEqual(mockAccount);
      expect(accountsRepository.findOne).toHaveBeenCalled();
    });
  });
});
