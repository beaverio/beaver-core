import { Test, TestingModule } from '@nestjs/testing';
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
      const options = {
        page: 1,
        limit: 10,
        sortBy: 'email',
        sortOrder: 'ASC' as const,
      };
      const query = { email: 'test@example.com' };
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };

      mockUserRepository.findAllPaginated.mockResolvedValue(expectedResult);

      const result = await service.getUsersPaginated(options, query);

      expect(mockUserRepository.findAllPaginated).toHaveBeenCalledWith(
        options,
        query,
      );
      expect(result).toBe(expectedResult);
    });

    it('should call repository findAllPaginated without query', async () => {
      const options = { page: 1, limit: 10 };
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };

      mockUserRepository.findAllPaginated.mockResolvedValue(expectedResult);

      const result = await service.getUsersPaginated(options);

      expect(mockUserRepository.findAllPaginated).toHaveBeenCalledWith(
        options,
        undefined,
      );
      expect(result).toBe(expectedResult);
    });
  });
});
