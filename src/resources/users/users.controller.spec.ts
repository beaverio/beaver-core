import { Test, TestingModule } from '@nestjs/testing';
import { PaginateQuery } from 'nestjs-paginate';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUserService = {
    getUsers: jest.fn(),
    getUsersPaginated: jest.fn(),
    getUser: jest.fn(),
    updateUser: jest.fn(),
    createUser: jest.fn(),
    updateUserInternal: jest.fn(),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    const mockUser = {
      id: 'test-id',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return non-paginated users when no pagination params are provided', async () => {
      const query = { email: 'test@example.com' };
      const paginateQuery: PaginateQuery = { path: '/users' }; // No page/limit means non-paginated
      const users = [mockUser];
      mockUserService.getUsers.mockResolvedValue(users);

      const result = await controller.getUsers(query, paginateQuery);

      expect(mockUserService.getUsers).toHaveBeenCalledWith(query);
      expect(mockUserService.getUsersPaginated).not.toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return paginated users when page param is provided', async () => {
      const query = { email: 'test@example.com' };
      const paginateQuery: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/users',
      };
      const paginatedResult = {
        data: [mockUser],
        meta: {
          itemsPerPage: 10,
          totalItems: 1,
          currentPage: 1,
          totalPages: 1,
          sortBy: [],
          searchBy: [],
          search: '',
          select: [],
        },
        links: {
          current: '/users?page=1&limit=10',
        },
      };
      mockUserService.getUsersPaginated.mockResolvedValue(paginatedResult);

      const result = await controller.getUsers(query, paginateQuery);

      expect(mockUserService.getUsersPaginated).toHaveBeenCalledWith(paginateQuery);
      expect(mockUserService.getUsers).not.toHaveBeenCalled();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
    });

    it('should return paginated users when limit param is provided', async () => {
      const query = {};
      const paginateQuery: PaginateQuery = {
        limit: 5,
        path: '/users',
      };
      const paginatedResult = {
        data: [],
        meta: {
          itemsPerPage: 5,
          totalItems: 0,
          currentPage: 1,
          totalPages: 0,
          sortBy: [],
          searchBy: [],
          search: '',
          select: [],
        },
        links: {
          current: '/users?limit=5',
        },
      };
      mockUserService.getUsersPaginated.mockResolvedValue(paginatedResult);

      await controller.getUsers(query, paginateQuery);

      expect(mockUserService.getUsersPaginated).toHaveBeenCalledWith(paginateQuery);
    });

    it('should handle pagination with sorting parameters', async () => {
      const query = {};
      const paginateQuery: PaginateQuery = {
        page: 2,
        limit: 20,
        sortBy: [['email', 'DESC'] as [string, string]],
        path: '/users',
      };
      const paginatedResult = {
        data: [],
        meta: {
          itemsPerPage: 20,
          totalItems: 0,
          currentPage: 2,
          totalPages: 0,
          sortBy: [['email', 'DESC']],
          searchBy: [],
          search: '',
          select: [],
        },
        links: {
          current: '/users?page=2&limit=20&sortBy=email:DESC',
        },
      };
      mockUserService.getUsersPaginated.mockResolvedValue(paginatedResult);

      await controller.getUsers(query, paginateQuery);

      expect(mockUserService.getUsersPaginated).toHaveBeenCalledWith(paginateQuery);
    });
  });
});
