import { Test, TestingModule } from '@nestjs/testing';
import { Paginated, PaginateQuery } from 'nestjs-paginate';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;

  // Helper function to create mock User with all required properties
  const createMockUser = (overrides: Partial<User> = {}): User => {
    const now = Date.now();
    const baseUser = {
      id: 'test-id',
      email: 'test@example.com',
      password: 'hashed-password',
      createdAt: now,
      updatedAt: now,
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

  const mockUserService = {
    getUsers: jest.fn(),
    getUser: jest.fn(),
    updateUser: jest.fn(),
    createUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: 'IUserService',
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 50,
        sortBy: [['createdAt', 'DESC']],
        searchBy: [],
        search: '',
        filter: {},
        path: '',
      };

      mockUserService.getUsers.mockResolvedValue(mockPaginatedResult);

      const result = await controller.getUsers(query);

      expect(mockUserService.getUsers).toHaveBeenCalledWith(query);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('test@example.com');
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.itemsPerPage).toBe(50);
    });

    it('should handle pagination with filtering', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        sortBy: [['email', 'ASC']],
        searchBy: [],
        search: '',
        filter: { email: 'test@example.com' },
        path: '',
      };

      mockUserService.getUsers.mockResolvedValue(mockPaginatedResult);

      const result = await controller.getUsers(query);

      expect(mockUserService.getUsers).toHaveBeenCalledWith(query);
      expect(result.data).toBeDefined();
    });

    it('should handle search functionality', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 50,
        sortBy: [['createdAt', 'DESC']],
        searchBy: ['email'],
        search: 'test',
        filter: {},
        path: '',
      };

      mockUserService.getUsers.mockResolvedValue(mockPaginatedResult);

      const result = await controller.getUsers(query);

      expect(mockUserService.getUsers).toHaveBeenCalledWith(query);
      expect(result.data).toBeDefined();
    });

    it('should handle sorting by different columns ASC/DESC', async () => {
      const queryAsc: PaginateQuery = {
        page: 1,
        limit: 50,
        sortBy: [['createdAt', 'ASC']],
        searchBy: [],
        search: '',
        filter: {},
        path: '',
      };

      const queryDesc: PaginateQuery = {
        page: 1,
        limit: 50,
        sortBy: [['updatedAt', 'DESC']],
        searchBy: [],
        search: '',
        filter: {},
        path: '',
      };

      mockUserService.getUsers.mockResolvedValue(mockPaginatedResult);

      const resultAsc = await controller.getUsers(queryAsc);
      const resultDesc = await controller.getUsers(queryDesc);

      expect(mockUserService.getUsers).toHaveBeenCalledWith(queryAsc);
      expect(mockUserService.getUsers).toHaveBeenCalledWith(queryDesc);
      expect(resultAsc.data).toBeDefined();
      expect(resultDesc.data).toBeDefined();
    });

    it('should handle complex filtering and search', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 25,
        sortBy: [['email', 'ASC']],
        searchBy: ['email'],
        search: 'john',
        filter: { email: 'john@example.com' },
        path: '',
      };

      mockUserService.getUsers.mockResolvedValue(mockPaginatedResult);

      const result = await controller.getUsers(query);

      expect(mockUserService.getUsers).toHaveBeenCalledWith(query);
      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
    });
  });

  describe('getSelf', () => {
    it('should return the current user', () => {
      const result = controller.getSelf(mockUser);

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const updateDto = { email: 'updated@example.com' };
      const updatedUser = createMockUser({ ...mockUser, ...updateDto });

      mockUserService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(mockUser, updateDto);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
      expect(result.email).toBe('updated@example.com');
      expect(result).not.toHaveProperty('password');
    });
  });
});
