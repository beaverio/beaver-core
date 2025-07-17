import { Test, TestingModule } from '@nestjs/testing';
import { PaginateQuery, Paginated } from 'nestjs-paginate';
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
    findAllPaginated: jest.fn(),
    findAllCursorPaginated: jest.fn(),
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

  describe('getUsersPaginated', () => {
    it('should call repository findAllPaginated method', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        sortBy: [['email', 'ASC'] as [string, string]],
        path: '/users',
      };
      const expectedResult = {
        data: [],
        meta: {
          itemsPerPage: 10,
          totalItems: 0,
          currentPage: 1,
          totalPages: 0,
          sortBy: [['email', 'ASC']],
          searchBy: [],
          search: '',
          select: [],
        },
        links: {
          current: '/users?page=1&limit=10',
        },
      };

      mockUserRepository.findAllPaginated.mockResolvedValue(expectedResult);

      const result = await service.getUsersPaginated(query);

      expect(mockUserRepository.findAllPaginated).toHaveBeenCalledWith(query);
      expect(result).toBe(expectedResult);
    });

    it('should call repository findAllPaginated without optional parameters', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/users',
      };
      const expectedResult = {
        data: [],
        meta: {
          itemsPerPage: 10,
          totalItems: 0,
          currentPage: 1,
          totalPages: 0,
          sortBy: [],
          searchBy: [],
          search: '',
          select: [],
        },
        links: {
          current: '/users?page=1&limit=10',
        },
      };

      mockUserRepository.findAllPaginated.mockResolvedValue(expectedResult);

      const result = await service.getUsersPaginated(query);

      expect(mockUserRepository.findAllPaginated).toHaveBeenCalledWith(query);
      expect(result).toBe(expectedResult);
    });
  });

  describe('getUsersCursorPaginated', () => {
    it('should return cursor-paginated users from repository', async () => {
      const query: PaginateQuery = {
        cursor: 'V001671444000000',
        limit: 10,
        sortBy: [['createdAt', 'DESC'] as [string, string]],
        path: '/users',
      };

      const expectedResult: Paginated<User> = {
        data: [mockUser],
        meta: {
          itemsPerPage: 10,
          cursor: 'V001671444000000',
          sortBy: [['createdAt', 'DESC']],
          searchBy: [],
          search: '',
          select: [],
        },
        links: {
          current: '/users?cursor=V001671444000000&limit=10',
          next: '/users?cursor=V001671444000001&limit=10',
        },
      };

      mockUserRepository.findAllCursorPaginated.mockResolvedValue(expectedResult);

      const result = await service.getUsersCursorPaginated(query);

      expect(mockUserRepository.findAllCursorPaginated).toHaveBeenCalledWith(query);
      expect(result).toBe(expectedResult);
    });
  });
});
