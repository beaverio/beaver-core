import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Paginated, PaginateQuery } from 'nestjs-paginate';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;

  // Helper function to create mock User with all required properties
  const createMockUser = (overrides: Partial<User> = {}): User => {
    const timestamp = new Date('2023-01-01').getTime();
    const baseUser = {
      id: 'test-id',
      email: 'test@example.com',
      password: 'hashedpassword',
      createdAt: timestamp,
      updatedAt: timestamp,
      lastLogin: null,
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

  const mockUserRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    findPaginated: jest.fn(),
    hardDelete: jest.fn(),
    updateLastLogin: jest.fn(),
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

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUsers', () => {
    it('should call repository findPaginated method', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 50,
        sortBy: [['createdAt', 'DESC']],
        searchBy: [],
        search: '',
        filter: {},
        path: '',
      };

      mockUserRepository.findPaginated.mockResolvedValue(mockPaginatedResult);

      const result = await service.getUsers(query);

      expect(mockUserRepository.findPaginated).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle filtering in paginated query', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        sortBy: [['email', 'ASC']],
        searchBy: [],
        search: '',
        filter: { email: 'test@example.com' },
        path: '',
      };

      mockUserRepository.findPaginated.mockResolvedValue(mockPaginatedResult);

      const result = await service.getUsers(query);

      expect(mockUserRepository.findPaginated).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle search with pagination', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        sortBy: [['createdAt', 'DESC']],
        searchBy: ['email'],
        search: 'test',
        filter: {},
        path: '',
      };

      mockUserRepository.findPaginated.mockResolvedValue(mockPaginatedResult);

      const result = await service.getUsers(query);

      expect(mockUserRepository.findPaginated).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle sorting by createdAt ASC', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 50,
        sortBy: [['createdAt', 'ASC']],
        searchBy: [],
        search: '',
        filter: {},
        path: '',
      };

      mockUserRepository.findPaginated.mockResolvedValue(mockPaginatedResult);

      const result = await service.getUsers(query);

      expect(mockUserRepository.findPaginated).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle sorting by updatedAt DESC', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 50,
        sortBy: [['updatedAt', 'DESC']],
        searchBy: [],
        search: '',
        filter: {},
        path: '',
      };

      mockUserRepository.findPaginated.mockResolvedValue(mockPaginatedResult);

      const result = await service.getUsers(query);

      expect(mockUserRepository.findPaginated).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle complex filtering and sorting', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 25,
        sortBy: [['createdAt', 'DESC']],
        searchBy: ['email'],
        search: 'test',
        filter: { email: 'test@example.com' },
        path: '',
      };

      mockUserRepository.findPaginated.mockResolvedValue(mockPaginatedResult);

      const result = await service.getUsers(query);

      expect(mockUserRepository.findPaginated).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe('getUser', () => {
    it('should return user when found', async () => {
      const query = { email: 'test@example.com' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUser(query);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      const query = { email: 'nonexistent@example.com' };
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getUser(query)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith(query);
    });
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      const createDto = {
        email: 'new@example.com',
        password: 'plaintext',
      };

      const expectedUser = {
        ...mockUser,
        email: 'new@example.com',
      };

      mockUserRepository.create.mockResolvedValue(expectedUser);

      const result = await service.createUser(createDto);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: expect.any(String), // Should be hashed
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const updateDto = { email: 'updated@example.com' };
      const updatedUser = { ...mockUser, ...updateDto };

      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser('test-id', updateDto);

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        'test-id',
        updateDto,
      );
      expect(result).toEqual(updatedUser);
    });

    it('should hash password when updating', async () => {
      const updateDto = { password: 'newpassword' };
      const updatedUser = { ...mockUser };

      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser('test-id', updateDto);

      expect(mockUserRepository.update).toHaveBeenCalledWith('test-id', {
        password: expect.any(String), // Should be hashed
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should hard delete user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.hardDelete.mockResolvedValue(undefined);

      const result = await service.deleteUser('test-id');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        id: 'test-id',
      });
      expect(mockUserRepository.hardDelete).toHaveBeenCalledWith('test-id');
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when trying to delete non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteUser('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserRepository.hardDelete).not.toHaveBeenCalled();
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const updatedUser = createMockUser({
        ...mockUser,
        lastLogin: Date.now(),
      });

      mockUserRepository.updateLastLogin.mockResolvedValue(updatedUser);

      const result = await service.updateLastLogin('test-id');

      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(
        'test-id',
      );
      expect(result).toEqual(updatedUser);
    });
  });
});
