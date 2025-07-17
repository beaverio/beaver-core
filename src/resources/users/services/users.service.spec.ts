import { Test, TestingModule } from '@nestjs/testing';
import {
  ICursorPaginationOptions,
  ICursorPaginatedResult,
} from 'src/common/interfaces/cursor-pagination.interface';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser: User = {
    id: 'test-id',
    email: 'test@example.com',
    password: 'hashedpassword',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockUserRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    findAllCursor: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUsersCursor', () => {
    it('should call repository findAllCursor method', async () => {
      const options: ICursorPaginationOptions = {
        limit: 10,
        sortBy: 'email',
        sortOrder: 'ASC',
      };
      const query = { email: 'test@example.com' };
      const expectedResult: ICursorPaginatedResult<User> = {
        data: [mockUser],
        nextCursor: 'next-cursor',
        prevCursor: undefined,
        hasNext: true,
        hasPrevious: false,
      };

      mockUserRepository.findAllCursor.mockResolvedValue(expectedResult);

      const result = await service.getUsersCursor(options, query);

      expect(mockUserRepository.findAllCursor).toHaveBeenCalledWith(
        options,
        query,
      );
      expect(result).toBe(expectedResult);
    });

    it('should call repository findAllCursor without optional parameters', async () => {
      const options: ICursorPaginationOptions = {
        limit: 10,
      };
      const expectedResult: ICursorPaginatedResult<User> = {
        data: [],
        nextCursor: undefined,
        prevCursor: undefined,
        hasNext: false,
        hasPrevious: false,
      };

      mockUserRepository.findAllCursor.mockResolvedValue(expectedResult);

      const result = await service.getUsersCursor(options);

      expect(mockUserRepository.findAllCursor).toHaveBeenCalledWith(
        options,
        undefined,
      );
      expect(result).toBe(expectedResult);
    });
  });
});
