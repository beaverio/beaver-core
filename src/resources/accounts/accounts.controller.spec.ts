import { Test, TestingModule } from '@nestjs/testing';
import { Paginated, PaginateQuery } from 'nestjs-paginate';
import { AccountsController } from './accounts.controller';
import { Account } from './entities/account.entity';
import { MembershipResponseDto } from '../memberships/dto/membership.dto';

describe('AccountsController', () => {
  let controller: AccountsController;

  // Helper function to create mock Account with all required properties
  const createMockAccount = (overrides: Partial<Account> = {}): Account => {
    const now = Date.now();
    const baseAccount = {
      id: 'test-id',
      name: 'Test Account',
      createdAt: now,
      updatedAt: now,
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

  const mockAccountsService = {
    createAccount: jest.fn(),
    getAccounts: jest.fn(),
    getAccount: jest.fn(),
    updateAccount: jest.fn(),
    deleteAccount: jest.fn(),
  };

  const mockMembershipsService = {
    findAccountMemberships: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: 'IAccountsService',
          useValue: mockAccountsService,
        },
        {
          provide: 'IMembershipsService',
          useValue: mockMembershipsService,
        },
      ],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAccount', () => {
    it('should create an account and return response DTO', async () => {
      const createDto = { name: 'New Account' };
      const createdAccount = createMockAccount({
        id: 'new-account-id',
        name: 'New Account',
      });

      mockAccountsService.createAccount.mockResolvedValue(createdAccount);

      const result = await controller.createAccount(createDto);

      expect(mockAccountsService.createAccount).toHaveBeenCalledWith(createDto);
      expect(result.id).toBe('new-account-id');
      expect(result.name).toBe('New Account');
      expect('createdAt' in result).toBe(true);
      expect('updatedAt' in result).toBe(true);
    });
  });

  describe('getAccounts', () => {
    it('should return paginated accounts', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '',
      };

      mockAccountsService.getAccounts.mockResolvedValue(mockPaginatedResult);

      const result = await controller.getAccounts(query);

      expect(mockAccountsService.getAccounts).toHaveBeenCalledWith(query);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('test-id');
    });
  });

  describe('getSelf', () => {
    it('should return a specific account', async () => {
      const accountId = 'test-account-id';
      const account = createMockAccount({
        id: accountId,
        name: 'Specific Account',
      });

      mockAccountsService.getAccount.mockResolvedValue(account);

      const result = await controller.getSelf(accountId);

      expect(mockAccountsService.getAccount).toHaveBeenCalledWith({
        id: accountId,
      });
      expect(result.id).toBe(accountId);
      expect(result.name).toBe('Specific Account');
    });
  });

  describe('updateUser', () => {
    it('should update an account and return response DTO', async () => {
      const accountId = 'test-account-id';
      const updateDto = { name: 'Updated Account' };
      const updatedAccount = createMockAccount({
        id: accountId,
        name: 'Updated Account',
      });

      mockAccountsService.updateAccount.mockResolvedValue(updatedAccount);

      const result = await controller.updateUser(accountId, updateDto);

      expect(mockAccountsService.updateAccount).toHaveBeenCalledWith(
        accountId,
        updateDto,
      );
      expect(result.id).toBe(accountId);
      expect(result.name).toBe('Updated Account');
    });
  });

  describe('deleteUser', () => {
    it('should delete an account', async () => {
      const accountId = 'test-account-id';

      mockAccountsService.deleteAccount.mockResolvedValue(undefined);

      const result = await controller.deleteUser(accountId);

      expect(mockAccountsService.deleteAccount).toHaveBeenCalledWith(accountId);
      expect(result).toBeUndefined();
    });
  });

  describe('getAccountMemberships', () => {
    it('should return account memberships', async () => {
      const accountId = 'test-account-id';
      const mockMemberships: MembershipResponseDto[] = [
        {
          id: 'membership-id-1',
          userId: 'user-id-1',
          accountId: 'test-account-id',
          permissions: ['account:read', 'account:write'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          user: {
            id: 'user-id-1',
            email: 'user1@example.com',
          },
          account: {
            id: 'test-account-id',
            name: 'Test Account',
          },
        },
      ];

      mockMembershipsService.findAccountMemberships.mockResolvedValue(mockMemberships);

      const result = await controller.getAccountMemberships(accountId);

      expect(mockMembershipsService.findAccountMemberships).toHaveBeenCalledWith(accountId);
      expect(result).toEqual(mockMemberships);
    });
  });
});
