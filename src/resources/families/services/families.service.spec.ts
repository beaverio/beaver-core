import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FamiliesService } from './families.service';
import { IFamiliesRepository } from '../interfaces/families-repository.interface';
import { Family } from '../entities/family.entity';
import { UpsertFamilyDto } from '../dto/family.dto';

describe('FamiliesService', () => {
  let service: FamiliesService;
  let familiesRepository: jest.Mocked<IFamiliesRepository>;

  const createMockFamily = (overrides: Partial<Family> = {}): Family => {
    const timestamp = Date.now();
    return {
      id: 'test-id',
      name: 'Test Family',
      createdAt: timestamp,
      updatedAt: timestamp,
      setCreationTimestamps: jest.fn(),
      setUpdateTimestamp: jest.fn(),
      memberships: [],
      ...overrides,
    } as Family;
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      hardDelete: jest.fn(),
      findPaginated: jest.fn(),
      cacheEntity: jest.fn(),
      getCachedEntity: jest.fn(),
      invalidateEntity: jest.fn(),
      invalidateCache: jest.fn(),
      getCacheKey: jest.fn(),
      getEntityCacheKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamiliesService,
        {
          provide: 'IFamiliesRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FamiliesService>(FamiliesService);
    familiesRepository = module.get('IFamiliesRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFamily', () => {
    it('should create a family successfully', async () => {
      const createDto: UpsertFamilyDto = { name: 'New Family' };
      const mockFamily = createMockFamily(createDto);

      familiesRepository.create.mockResolvedValue(mockFamily);

      const result = await service.createFamily(createDto);

      expect(familiesRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockFamily);
    });
  });

  describe('getFamily', () => {
    it('should return a family when found', async () => {
      const familyId = 'test-id';
      const mockFamily = createMockFamily({ id: familyId });

      familiesRepository.findOne.mockResolvedValue(mockFamily);

      const result = await service.getFamily({ id: familyId });

      expect(familiesRepository.findOne).toHaveBeenCalledWith({ id: familyId });
      expect(result).toEqual(mockFamily);
    });

    it('should throw NotFoundException when family not found', async () => {
      const familyId = 'non-existent-id';

      familiesRepository.findOne.mockResolvedValue(null);

      await expect(service.getFamily({ id: familyId })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getFamily({ id: familyId })).rejects.toThrow(
        'Family not found',
      );
    });
  });

  describe('updateFamily', () => {
    it('should update a family successfully', async () => {
      const familyId = 'test-id';
      const updateDto: UpsertFamilyDto = { name: 'Updated Family' };
      const mockFamily = createMockFamily({ id: familyId, ...updateDto });

      familiesRepository.update.mockResolvedValue(mockFamily);

      const result = await service.updateFamily(familyId, updateDto);

      expect(familiesRepository.update).toHaveBeenCalledWith(familyId, updateDto);
      expect(result).toEqual(mockFamily);
    });
  });

  describe('deleteFamily', () => {
    it('should delete a family successfully when it exists', async () => {
      const familyId = 'test-id';
      const mockFamily = createMockFamily({ id: familyId });

      familiesRepository.findOne.mockResolvedValue(mockFamily);
      familiesRepository.hardDelete.mockResolvedValue(undefined);

      await service.deleteFamily(familyId);

      expect(familiesRepository.findOne).toHaveBeenCalledWith({ id: familyId });
      expect(familiesRepository.hardDelete).toHaveBeenCalledWith(familyId);
    });

    it('should throw NotFoundException when trying to delete non-existent family', async () => {
      const familyId = 'non-existent-id';

      familiesRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteFamily(familyId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteFamily(familyId)).rejects.toThrow(
        'Family not found',
      );

      expect(familiesRepository.hardDelete).not.toHaveBeenCalled();
    });
  });

  describe('getFamilies', () => {
    it('should return paginated families', async () => {
      const query = { 
        page: 1, 
        limit: 10,
        path: '/families',
        sortBy: [],
        searchBy: [],
        search: '',
        select: [],
      };
      const mockPaginatedResult = {
        data: [createMockFamily()],
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
          first: '',
          previous: '',
          current: '',
          next: '',
          last: '',
        },
      };

      familiesRepository.findPaginated.mockResolvedValue(mockPaginatedResult as any);

      const result = await service.getFamilies(query as any);

      expect(familiesRepository.findPaginated).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResult);
    });
  });
});