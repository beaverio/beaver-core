import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Paginated, PaginateQuery } from 'nestjs-paginate';
import { AccountsService } from './accounts.service';
import { Account } from '../entities/account.entity';

describe('AccountsService', () => {
  let service: AccountsService;

  // Helper function to create mock Account with all required properties
  const createMockAccount = (overrides: Partial<Account> = {}): Account => {
    const timestamp = new Date('2023-01-01').getTime();
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

  const mockAccountsRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    hardDelete: jest.fn(),
    findPaginated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: 'IAccountsRepository',
          useValue: mockAccountsRepository,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAccounts', () => {
    it('should return paginated accounts', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '',
      };

      mockAccountsRepository.findPaginated.mockResolvedValue(
        mockPaginatedResult,
      );

      const result = await service.getAccounts(query);

      expect(mockAccountsRepository.findPaginated).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe('getAccount', () => {
    it('should return an account when found', async () => {
      const query = { id: 'test-id' };
      mockAccountsRepository.findOne.mockResolvedValue(mockAccount);

      const result = await service.getAccount(query);

      expect(mockAccountsRepository.findOne).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException when account not found', async () => {
      const query = { id: 'nonexistent-id' };
      mockAccountsRepository.findOne.mockResolvedValue(null);

      await expect(service.getAccount(query)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockAccountsRepository.findOne).toHaveBeenCalledWith(query);
    });
  });

  describe('createAccount', () => {
    it('should create an account', async () => {
      const createDto = {
        name: 'New Account',
      };

      const expectedAccount = {
        ...mockAccount,
        name: 'New Account',
      };

      mockAccountsRepository.create.mockResolvedValue(expectedAccount);

      const result = await service.createAccount(createDto);

      expect(mockAccountsRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedAccount);
    });
  });

  describe('updateAccount', () => {
    it('should update account', async () => {
      const updateDto = { name: 'Updated Account' };
      const updatedAccount = { ...mockAccount, ...updateDto };

      mockAccountsRepository.update.mockResolvedValue(updatedAccount);

      const result = await service.updateAccount('test-id', updateDto);

      expect(mockAccountsRepository.update).toHaveBeenCalledWith(
        'test-id',
        updateDto,
      );
      expect(result).toEqual(updatedAccount);
    });
  });

  describe('deleteAccount', () => {
    it('should hard delete account', async () => {
      mockAccountsRepository.findOne.mockResolvedValue(mockAccount);
      mockAccountsRepository.hardDelete.mockResolvedValue(undefined);

      const result = await service.deleteAccount('test-id');

      expect(mockAccountsRepository.findOne).toHaveBeenCalledWith({
        id: 'test-id',
      });
      expect(mockAccountsRepository.hardDelete).toHaveBeenCalledWith('test-id');
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when trying to delete non-existent account', async () => {
      mockAccountsRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteAccount('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockAccountsRepository.findOne).toHaveBeenCalledWith({
        id: 'nonexistent-id',
      });
      expect(mockAccountsRepository.hardDelete).not.toHaveBeenCalled();
    });
  });
});
