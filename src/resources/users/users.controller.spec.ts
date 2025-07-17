import { Test, TestingModule } from '@nestjs/testing';
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
      const users = [mockUser];
      mockUserService.getUsers.mockResolvedValue(users);

      const result = await controller.getUsers(query);

      expect(mockUserService.getUsers).toHaveBeenCalledWith(query);
      expect(mockUserService.getUsersPaginated).not.toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return paginated users when page param is provided', async () => {
      const query = { page: 1, limit: 10, email: 'test@example.com' };
      const paginatedResult = {
        data: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };
      mockUserService.getUsersPaginated.mockResolvedValue(paginatedResult);

      const result = await controller.getUsers(query);

      expect(mockUserService.getUsersPaginated).toHaveBeenCalledWith(
        { page: 1, limit: 10, sortBy: undefined, sortOrder: undefined },
        { email: 'test@example.com' },
      );
      expect(mockUserService.getUsers).not.toHaveBeenCalled();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('totalPages');
    });

    it('should return paginated users when limit param is provided', async () => {
      const query = { limit: 5 };
      const paginatedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 5,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };
      mockUserService.getUsersPaginated.mockResolvedValue(paginatedResult);

      await controller.getUsers(query);

      expect(mockUserService.getUsersPaginated).toHaveBeenCalledWith(
        { page: 1, limit: 5, sortBy: undefined, sortOrder: undefined },
        undefined,
      );
    });

    it('should handle pagination with sorting parameters', async () => {
      const query = {
        page: 2,
        limit: 20,
        sortBy: 'email',
        sortOrder: 'DESC' as const,
      };
      const paginatedResult = {
        data: [],
        total: 0,
        page: 2,
        limit: 20,
        totalPages: 0,
        hasNext: false,
        hasPrevious: true,
      };
      mockUserService.getUsersPaginated.mockResolvedValue(paginatedResult);

      await controller.getUsers(query);

      expect(mockUserService.getUsersPaginated).toHaveBeenCalledWith(
        { page: 2, limit: 20, sortBy: 'email', sortOrder: 'DESC' },
        undefined,
      );
    });
  });
});
