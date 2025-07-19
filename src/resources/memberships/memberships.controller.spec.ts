import { Test, TestingModule } from '@nestjs/testing';
import { JWTAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MembershipsController } from './memberships.controller';
import { IMembershipsService } from './interfaces/memberships-service.interface';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
  MembershipResponseDto,
} from './dto/membership.dto';

describe('MembershipsController', () => {
  let controller: MembershipsController;
  let service: Partial<IMembershipsService>;

  const mockMembershipResponse: MembershipResponseDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    familyId: '123e4567-e89b-12d3-a456-426614174002',
    permissions: ['family:read', 'family:write'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      email: 'test@example.com',
    },
    family: {
      id: '123e4567-e89b-12d3-a456-426614174002',
      name: 'Test Family',
    },
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembershipsController],
      providers: [
        {
          provide: 'IMembershipsService',
          useValue: service,
        },
      ],
    })
      .overrideGuard(JWTAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MembershipsController>(MembershipsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a membership', async () => {
      const createDto: CreateMembershipDto = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        familyId: '123e4567-e89b-12d3-a456-426614174002',
        permissions: ['family:read', 'family:write'],
      };

      service.create = jest.fn().mockResolvedValue(mockMembershipResponse);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockMembershipResponse);
    });
  });

  describe('findOne', () => {
    it('should return a membership by id', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      service.findOne = jest.fn().mockResolvedValue(mockMembershipResponse);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockMembershipResponse);
    });
  });

  describe('update', () => {
    it('should update a membership', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto: UpdateMembershipDto = {
        permissions: ['family:read'],
      };

      service.update = jest.fn().mockResolvedValue(mockMembershipResponse);

      const result = await controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual(mockMembershipResponse);
    });
  });

  describe('delete', () => {
    it('should delete a membership', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      service.delete = jest.fn().mockResolvedValue(undefined);

      await controller.delete(id);

      expect(service.delete).toHaveBeenCalledWith(id);
    });
  });
});
