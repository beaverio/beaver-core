import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ICacheService } from '../../../common/interfaces/cache-service.interface';
import { Family } from '../entities/family.entity';
import { FamiliesRepository } from './families.repository';

describe('FamiliesRepository', () => {
  let repository: FamiliesRepository;
  let familiesRepository: jest.Mocked<Repository<Family>>;
  let cacheService: jest.Mocked<ICacheService>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<Family>>;

  // Helper function to create mock Family with all required properties
  const createMockFamily = (overrides: Partial<Family> = {}): Family => {
    const timestamp = new Date('2023-01-01T00:00:00Z').getTime();
    const baseFamily = {
      id: 'test-id',
      name: 'Test Family',
      createdAt: timestamp,
      updatedAt: timestamp,
      setCreationTimestamps: jest.fn(),
      setUpdateTimestamp: jest.fn(),
      ...overrides,
    };

    // Add getter properties with proper typing
    Object.defineProperty(baseFamily, 'createdAtDate', {
      get: function (this: { createdAt: number }) {
        return new Date(this.createdAt);
      },
    });
    Object.defineProperty(baseFamily, 'updatedAtDate', {
      get: function (this: { updatedAt: number }) {
        return new Date(this.updatedAt);
      },
    });

    return baseFamily as Family;
  };

  beforeEach(async () => {
    // Create a mock repository with all the methods AccountsRepository needs
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
      metadata: {
        tableName: 'families',
      },
    };

    // Create mock cache service
    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      isHealthy: jest.fn().mockResolvedValue(true),
    };

    // Create mock query builder
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
    } as any;

    mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamiliesRepository,
        {
          provide: getRepositoryToken(Family),
          useValue: mockRepository,
        },
        {
          provide: 'ICacheService',
          useValue: mockCacheService,
        },
      ],
    }).compile();

    repository = module.get<FamiliesRepository>(FamiliesRepository);
    familiesRepository = module.get(getRepositoryToken(Family));
    cacheService = module.get('ICacheService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and cache a family', async () => {
      const createDto = { name: 'New Family' };
      const mockFamily = createMockFamily(createDto);

      familiesRepository.create.mockReturnValue(mockFamily);
      familiesRepository.save.mockResolvedValue(mockFamily);
      cacheService.set.mockResolvedValue(undefined);

      const result = await repository.create(createDto);

      expect(familiesRepository.create).toHaveBeenCalledWith(createDto);
      expect(familiesRepository.save).toHaveBeenCalledWith(mockFamily);
      expect(cacheService.set).toHaveBeenCalledWith(
        `family:${mockFamily.id}`,
        mockFamily,
        expect.any(Number),
      );
      expect(result).toEqual(mockFamily);
    });
  });

  describe('findOne', () => {
    it('should return cached family if available', async () => {
      const familyId = 'test-id';
      const mockFamily = createMockFamily({ id: familyId });

      cacheService.get.mockResolvedValue(mockFamily);

      const result = await repository.findOne({ id: familyId });

      expect(cacheService.get).toHaveBeenCalledWith(`family:${familyId}`);
      expect(familiesRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockFamily);
    });

    it('should fetch from database and cache if not in cache', async () => {
      const familyId = 'test-id';
      const mockFamily = createMockFamily({ id: familyId });

      cacheService.get.mockResolvedValue(null);
      familiesRepository.findOne.mockResolvedValue(mockFamily);
      cacheService.set.mockResolvedValue(undefined);

      const result = await repository.findOne({ id: familyId });

      expect(cacheService.get).toHaveBeenCalledWith(`family:${familyId}`);
      expect(familiesRepository.findOne).toHaveBeenCalledWith({
        where: { id: familyId },
        relations: ['memberships'],
      });
      expect(cacheService.set).toHaveBeenCalledWith(
        `family:${familyId}`,
        mockFamily,
        expect.any(Number),
      );
      expect(result).toEqual(mockFamily);
    });

    it('should return null if family not found', async () => {
      const familyId = 'non-existent-id';

      cacheService.get.mockResolvedValue(null);
      familiesRepository.findOne.mockResolvedValue(null);

      const result = await repository.findOne({ id: familyId });

      expect(result).toBeNull();
      expect(cacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and cache a family', async () => {
      const familyId = 'test-id';
      const updateDto = { name: 'Updated Family' };
      const mockFamily = createMockFamily({ id: familyId, ...updateDto });

      familiesRepository.update.mockResolvedValue({ affected: 1 } as any);
      familiesRepository.findOne.mockResolvedValue(mockFamily);
      cacheService.set.mockResolvedValue(undefined);

      const result = await repository.update(familyId, updateDto);

      expect(familiesRepository.update).toHaveBeenCalledWith(
        familyId,
        updateDto,
      );
      expect(familiesRepository.findOne).toHaveBeenCalledWith({
        where: { id: familyId },
        relations: ['memberships'],
      });
      expect(cacheService.set).toHaveBeenCalledWith(
        `family:${familyId}`,
        mockFamily,
        expect.any(Number),
      );
      expect(result).toEqual(mockFamily);
    });
  });

  describe('hardDelete', () => {
    it('should invalidate cache and delete family', async () => {
      const familyId = 'test-id';

      cacheService.delete.mockResolvedValue(undefined);
      familiesRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await repository.hardDelete(familyId);

      expect(cacheService.delete).toHaveBeenCalledWith(`family:${familyId}`);
      expect(familiesRepository.delete).toHaveBeenCalledWith(familyId);
    });
  });
});
