import { Test, TestingModule } from '@nestjs/testing';
import { FamiliesController } from './families.controller';
import { IFamiliesService } from './interfaces/families-service.interface';
import { IMembershipsService } from '../memberships/interfaces/memberships-service.interface';
import { Family } from './entities/family.entity';
import { UpsertFamilyDto, FamilyResponseDto } from './dto/family.dto';
import { MembershipResponseDto } from '../memberships/dto/membership.dto';

describe('FamiliesController', () => {
  let controller: FamiliesController;
  let familiesService: jest.Mocked<IFamiliesService>;
  let membershipsService: jest.Mocked<IMembershipsService>;

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
    const mockFamiliesService = {
      createFamily: jest.fn(),
      getFamilies: jest.fn(),
      getFamily: jest.fn(),
      updateFamily: jest.fn(),
      deleteFamily: jest.fn(),
    };

    const mockMembershipsService = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUserMemberships: jest.fn(),
      findFamilyMemberships: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FamiliesController],
      providers: [
        {
          provide: 'IFamiliesService',
          useValue: mockFamiliesService,
        },
        {
          provide: 'IMembershipsService',
          useValue: mockMembershipsService,
        },
      ],
    }).compile();

    controller = module.get<FamiliesController>(FamiliesController);
    familiesService = module.get('IFamiliesService');
    membershipsService = module.get('IMembershipsService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFamily', () => {
    it('should create and return a family', async () => {
      const createDto: UpsertFamilyDto = { name: 'New Family' };
      const mockFamily = createMockFamily(createDto);

      familiesService.createFamily.mockResolvedValue(mockFamily);

      const result = await controller.createFamily(createDto);

      expect(familiesService.createFamily).toHaveBeenCalledWith(createDto);
      expect(result).toBeInstanceOf(FamilyResponseDto);
      expect(result.name).toBe('New Family');
    });
  });

  describe('getSelf', () => {
    it('should return a family by id', async () => {
      const familyId = 'test-id';
      const mockFamily = createMockFamily({ id: familyId });

      familiesService.getFamily.mockResolvedValue(mockFamily);

      const result = await controller.getSelf(familyId);

      expect(familiesService.getFamily).toHaveBeenCalledWith({ id: familyId });
      expect(result).toBeInstanceOf(FamilyResponseDto);
      expect(result.id).toBe(familyId);
    });
  });

  describe('updateFamily', () => {
    it('should update and return a family', async () => {
      const familyId = 'test-id';
      const updateDto: UpsertFamilyDto = { name: 'Updated Family' };
      const mockFamily = createMockFamily({ id: familyId, ...updateDto });

      familiesService.updateFamily.mockResolvedValue(mockFamily);

      const result = await controller.updateFamily(familyId, updateDto);

      expect(familiesService.updateFamily).toHaveBeenCalledWith(familyId, updateDto);
      expect(result).toBeInstanceOf(FamilyResponseDto);
      expect(result.name).toBe('Updated Family');
    });
  });

  describe('deleteFamily', () => {
    it('should delete a family', async () => {
      const familyId = 'test-id';

      familiesService.deleteFamily.mockResolvedValue(undefined);

      await controller.deleteFamily(familyId);

      expect(familiesService.deleteFamily).toHaveBeenCalledWith(familyId);
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

      familiesService.getFamilies.mockResolvedValue(mockPaginatedResult as any);

      const result = await controller.getFamilies(query as any);

      expect(familiesService.getFamilies).toHaveBeenCalledWith(query);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toBeInstanceOf(FamilyResponseDto);
    });
  });

  describe('getFamilyMemberships', () => {
    it('should return family memberships', async () => {
      const familyId = 'test-id';
      const mockMemberships: MembershipResponseDto[] = [
        {
          id: 'membership-1',
          userId: 'user-1',
          familyId: familyId,
          permissions: ['read'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      membershipsService.findFamilyMemberships.mockResolvedValue(mockMemberships);

      const result = await controller.getFamilyMemberships(familyId);

      expect(membershipsService.findFamilyMemberships).toHaveBeenCalledWith(familyId);
      expect(result).toEqual(mockMemberships);
    });
  });
});