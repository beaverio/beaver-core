import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICacheService } from '../../../common/interfaces/cache-service.interface';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
} from '../dto/membership.dto';
import { Membership } from '../entities/membership.entity';
import { MembershipsRepository } from './memberships.repository';

describe('MembershipsRepository', () => {
  let repository: MembershipsRepository;
  let mockRepo: Partial<Repository<Membership>>;
  let mockCacheService: Partial<ICacheService>;

  const mockMembership: Membership = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    familyId: '123e4567-e89b-12d3-a456-426614174002',
    permissions: ['family:read', 'family:write'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    setCreationTimestamps: jest.fn(),
    setUpdateTimestamp: jest.fn(),
    get createdAtDate() {
      return new Date(this.createdAt);
    },
    get updatedAtDate() {
      return new Date(this.updatedAt);
    },
    user: null as any,
    family: null as any,
  };

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findOneBy: jest.fn(),
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    const mockUsersRepository = {
      getEntityCacheKey: jest.fn(),
    };

    const mockFamiliesRepository = {
      getEntityCacheKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipsRepository,
        {
          provide: getRepositoryToken(Membership),
          useValue: mockRepo,
        },
        {
          provide: 'ICacheService',
          useValue: mockCacheService,
        },
        {
          provide: 'IUsersRepository',
          useValue: mockUsersRepository,
        },
        {
          provide: 'IFamiliesRepository',
          useValue: mockFamiliesRepository,
        },
      ],
    }).compile();

    repository = module.get<MembershipsRepository>(MembershipsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and cache a membership', async () => {
      const createDto: CreateMembershipDto = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        familyId: '123e4567-e89b-12d3-a456-426614174002',
        permissions: ['family:read', 'family:write'],
      };

      mockRepo.create = jest.fn().mockReturnValue(mockMembership);
      mockRepo.save = jest.fn().mockResolvedValue(mockMembership);
      mockCacheService.set = jest.fn().mockResolvedValue(undefined);
      mockCacheService.delete = jest.fn().mockResolvedValue(undefined);

      const result = await repository.create(createDto);

      expect(mockRepo.create).toHaveBeenCalledWith(createDto);
      expect(mockRepo.save).toHaveBeenCalledWith(mockMembership);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'membership:123e4567-e89b-12d3-a456-426614174000',
        mockMembership,
        30 * 60 * 1000,
      );
      expect(result).toEqual(mockMembership);
    });
  });

  describe('findOne', () => {
    it('should return cached membership if found', async () => {
      const query = { id: '123e4567-e89b-12d3-a456-426614174000' };
      mockCacheService.get = jest.fn().mockResolvedValue(mockMembership);

      const result = await repository.findOne(query);

      expect(mockCacheService.get).toHaveBeenCalledWith(
        'membership:123e4567-e89b-12d3-a456-426614174000',
      );
      expect(mockRepo.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockMembership);
    });

    it('should query database and cache result if not cached', async () => {
      const query = { id: '123e4567-e89b-12d3-a456-426614174000' };
      mockCacheService.get = jest.fn().mockResolvedValue(null);
      mockRepo.findOne = jest.fn().mockResolvedValue(mockMembership);
      mockCacheService.set = jest.fn().mockResolvedValue(undefined);

      const result = await repository.findOne(query);

      expect(mockCacheService.get).toHaveBeenCalledWith(
        'membership:123e4567-e89b-12d3-a456-426614174000',
      );
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: query,
        relations: ['user', 'family'],
      });
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'membership:123e4567-e89b-12d3-a456-426614174000',
        mockMembership,
        30 * 60 * 1000,
      );
      expect(result).toEqual(mockMembership);
    });

    it('should return null if membership not found', async () => {
      const query = { userId: '123e4567-e89b-12d3-a456-426614174001' };
      mockRepo.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findOne(query);

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: query,
        relations: ['user', 'family'],
      });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update membership and invalidate cache', async () => {
      const updateDto: UpdateMembershipDto = {
        permissions: ['family:read'],
      };
      const id = '123e4567-e89b-12d3-a456-426614174000';

      mockRepo.update = jest.fn().mockResolvedValue({ affected: 1 });
      mockRepo.findOne = jest.fn().mockResolvedValue(mockMembership);
      mockCacheService.set = jest.fn().mockResolvedValue(undefined);
      mockCacheService.delete = jest.fn().mockResolvedValue(undefined);

      const result = await repository.update(id, updateDto);

      expect(mockRepo.update).toHaveBeenCalledWith(id, updateDto);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['user', 'family'],
      });
      expect(result).toEqual(mockMembership);
    });
  });

  describe('hardDelete', () => {
    it('should delete membership and invalidate cache', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      mockRepo.findOneBy = jest.fn().mockResolvedValue(mockMembership);
      mockRepo.delete = jest.fn().mockResolvedValue({ affected: 1 });
      mockCacheService.delete = jest.fn().mockResolvedValue(undefined);

      await repository.hardDelete(id);

      expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id });
      expect(mockRepo.delete).toHaveBeenCalledWith(id);
      expect(mockCacheService.delete).toHaveBeenCalledTimes(5); // entity, user memberships, account memberships, user entity, account entity
    });
  });

  describe('findByUserId', () => {
    it('should return cached user memberships if found', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const memberships = [mockMembership];
      mockCacheService.get = jest.fn().mockResolvedValue(memberships);

      const result = await repository.findByUserId(userId);

      expect(mockCacheService.get).toHaveBeenCalledWith(
        'membership:user:123e4567-e89b-12d3-a456-426614174001:memberships',
      );
      expect(result).toEqual(memberships);
    });

    it('should query database and cache result if not cached', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const memberships = [mockMembership];
      mockCacheService.get = jest.fn().mockResolvedValue(null);
      mockRepo.find = jest.fn().mockResolvedValue(memberships);
      mockCacheService.set = jest.fn().mockResolvedValue(undefined);

      const result = await repository.findByUserId(userId);

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['family'],
      });
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'membership:user:123e4567-e89b-12d3-a456-426614174001:memberships',
        memberships,
        30 * 60 * 1000,
      );
      expect(result).toEqual(memberships);
    });
  });

  describe('findByFamilyId', () => {
    it('should return account memberships from database', async () => {
      const familyId = '123e4567-e89b-12d3-a456-426614174002';
      const memberships = [mockMembership];
      mockCacheService.get = jest.fn().mockResolvedValue(null);
      mockRepo.find = jest.fn().mockResolvedValue(memberships);
      mockCacheService.set = jest.fn().mockResolvedValue(undefined);

      const result = await repository.findByFamilyId(familyId);

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { familyId },
        relations: ['user'],
      });
      expect(result).toEqual(memberships);
    });
  });

  describe('findByUserAndFamily', () => {
    it('should find membership by userId and familyId', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const familyId = '123e4567-e89b-12d3-a456-426614174002';
      mockRepo.findOne = jest.fn().mockResolvedValue(mockMembership);

      const result = await repository.findByUserAndFamily(userId, familyId);

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { userId, familyId },
        relations: ['user', 'family'],
      });
      expect(result).toEqual(mockMembership);
    });
  });
});
