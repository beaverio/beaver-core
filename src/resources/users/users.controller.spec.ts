import { Test, TestingModule } from '@nestjs/testing';
import { CursorPaginationQueryDto } from 'src/common/dto/cursor-pagination.dto';
import { ICursorPaginatedResult } from 'src/common/interfaces/cursor-pagination.interface';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUser = {
    id: 'test-id',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserService = {
    getUsers: jest.fn(),
    getUsersCursor: jest.fn(),
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

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    it('should return users when no pagination params are provided', async () => {
      const query = { email: 'test@example.com' };
      const paginationQuery = {}; // Empty object to simulate no query params
      const users = [mockUser];

      mockUserService.getUsers.mockResolvedValue(users);

      const result = await controller.getUsers(
        query,
        paginationQuery as CursorPaginationQueryDto,
      );

      expect(mockUserService.getUsers).toHaveBeenCalledWith(query);
      expect(mockUserService.getUsersCursor).not.toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return cursor paginated users when cursor param is provided', async () => {
      const query = { email: 'test@example.com' };
      const paginationQuery = new CursorPaginationQueryDto();
      paginationQuery.cursor = 'test-cursor';
      paginationQuery.limit = 10;

      const cursorResult: ICursorPaginatedResult<User> = {
        data: [mockUser as User],
        nextCursor: 'next-cursor',
        prevCursor: undefined,
        hasNext: true,
        hasPrevious: false,
      };

      mockUserService.getUsersCursor.mockResolvedValue(cursorResult);

      const result = await controller.getUsers(query, paginationQuery);

      expect(mockUserService.getUsersCursor).toHaveBeenCalledWith(
        paginationQuery,
        query,
      );
      expect(mockUserService.getUsers).not.toHaveBeenCalled();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('nextCursor');
      expect(result).toHaveProperty('hasNext');
    });

    it('should return cursor paginated users when limit param is provided', async () => {
      const query = { email: 'test@example.com' };
      const paginationQuery = new CursorPaginationQueryDto();
      paginationQuery.limit = 5;

      const cursorResult: ICursorPaginatedResult<User> = {
        data: [mockUser as User],
        nextCursor: undefined,
        prevCursor: undefined,
        hasNext: false,
        hasPrevious: false,
      };

      mockUserService.getUsersCursor.mockResolvedValue(cursorResult);

      await controller.getUsers(query, paginationQuery);

      expect(mockUserService.getUsersCursor).toHaveBeenCalledWith(
        paginationQuery,
        query,
      );
    });

    it('should handle pagination with sorting parameters', async () => {
      const query = { email: 'test@example.com' };
      const paginationQuery = new CursorPaginationQueryDto();
      paginationQuery.limit = 20;
      paginationQuery.sortBy = 'email';
      paginationQuery.sortOrder = 'DESC';

      const cursorResult: ICursorPaginatedResult<User> = {
        data: [mockUser as User],
        nextCursor: 'next-cursor',
        prevCursor: 'prev-cursor',
        hasNext: true,
        hasPrevious: true,
      };

      mockUserService.getUsersCursor.mockResolvedValue(cursorResult);

      await controller.getUsers(query, paginationQuery);

      expect(mockUserService.getUsersCursor).toHaveBeenCalledWith(
        paginationQuery,
        query,
      );
    });
  });

  describe('getUsersCursor', () => {
    it('should return cursor-paginated users', async () => {
      const query = { email: 'test@example.com' };
      const paginationQuery = new CursorPaginationQueryDto();
      paginationQuery.cursor = 'test-cursor';
      paginationQuery.limit = 10;
      paginationQuery.sortBy = 'createdAt';
      paginationQuery.sortOrder = 'DESC';

      const cursorResult: ICursorPaginatedResult<User> = {
        data: [mockUser as User],
        nextCursor: 'next-cursor',
        prevCursor: 'prev-cursor',
        hasNext: true,
        hasPrevious: true,
      };

      mockUserService.getUsersCursor.mockResolvedValue(cursorResult);

      const result = await controller.getUsersCursor(query, paginationQuery);

      expect(mockUserService.getUsersCursor).toHaveBeenCalledWith(
        paginationQuery,
        query,
      );
      expect(result.data).toBeDefined();
      expect(result.nextCursor).toEqual(cursorResult.nextCursor);
      expect(result.prevCursor).toEqual(cursorResult.prevCursor);
      expect(result.hasNext).toEqual(cursorResult.hasNext);
      expect(result.hasPrevious).toEqual(cursorResult.hasPrevious);
    });
  });
});
