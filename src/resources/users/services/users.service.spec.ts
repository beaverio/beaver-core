import { Test, TestingModule } from '@nestjs/testing';
import { PaginateQuery } from 'nestjs-paginate';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    findAllPaginated: jest.fn(),
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
});
