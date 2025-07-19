import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { IMembershipsRepository } from '../interfaces/memberships-repository.interface';
import { IUsersRepository } from '../../users/interfaces/users-repository.interface';
import { IFamiliesRepository } from '../../families/interfaces/families-repository.interface';
import { MembershipsService } from './memberships.service';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
} from '../dto/membership.dto';
import { Membership } from '../entities/membership.entity';
import { User } from '../../users/entities/user.entity';
import { Family } from '../../families/entities/family.entity';

describe('MembershipsService', () => {
  let service: MembershipsService;
  let membershipsRepository: Partial<IMembershipsRepository>;
  let usersRepository: Partial<IUsersRepository>;
  let familiesRepository: Partial<IFamiliesRepository>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'test@example.com',
    password: 'hashedpassword',
    lastLogin: null,
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
    memberships: [],
  };

  const mockFamily: Family = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Test Account',
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
    memberships: [],
  };

  const mockMembership: Membership = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: mockUser.id,
    familyId: mockFamily.id,
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
    user: mockUser,
    family: mockFamily,
  };

  beforeEach(async () => {
    membershipsRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      hardDelete: jest.fn(),
      findByUserId: jest.fn(),
      findByFamilyId: jest.fn(),
      findByUserAndFamily: jest.fn(),
    };

    usersRepository = {
      findOne: jest.fn(),
    };

    familiesRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipsService,
        {
          provide: 'IMembershipsRepository',
          useValue: membershipsRepository,
        },
        {
          provide: 'IUsersRepository',
          useValue: usersRepository,
        },
        {
          provide: 'IFamiliesRepository',
          useValue: familiesRepository,
        },
      ],
    }).compile();

    service = module.get<MembershipsService>(MembershipsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateMembershipDto = {
      userId: mockUser.id,
      familyId: mockFamily.id,
      permissions: ['family:read', 'family:write'],
    };

    it('should create a membership successfully', async () => {
      usersRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      familiesRepository.findOne = jest.fn().mockResolvedValue(mockFamily);
      membershipsRepository.findByUserAndFamily = jest
        .fn()
        .mockResolvedValue(null);
      membershipsRepository.create = jest
        .fn()
        .mockResolvedValue(mockMembership);

      const result = await service.create(createDto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        id: createDto.userId,
      });
      expect(familiesRepository.findOne).toHaveBeenCalledWith({
        id: createDto.familyId,
      });
      expect(membershipsRepository.findByUserAndFamily).toHaveBeenCalledWith(
        createDto.userId,
        createDto.familyId,
      );
      expect(membershipsRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({
        id: mockMembership.id,
        userId: mockMembership.userId,
        familyId: mockMembership.familyId,
        permissions: mockMembership.permissions,
        createdAt: new Date(mockMembership.createdAt).toISOString(),
        updatedAt: new Date(mockMembership.updatedAt).toISOString(),
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
        family: {
          id: mockFamily.id,
          name: mockFamily.name,
        },
      });
    });

    it('should throw BadRequestException if user not found', async () => {
      usersRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        id: createDto.userId,
      });
      expect(familiesRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if account not found', async () => {
      usersRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      familiesRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(familiesRepository.findOne).toHaveBeenCalledWith({
        id: createDto.familyId,
      });
    });

    it('should throw ConflictException if membership already exists', async () => {
      usersRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      familiesRepository.findOne = jest.fn().mockResolvedValue(mockFamily);
      membershipsRepository.findByUserAndFamily = jest
        .fn()
        .mockResolvedValue(mockMembership);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(membershipsRepository.findByUserAndFamily).toHaveBeenCalledWith(
        createDto.userId,
        createDto.familyId,
      );
    });
  });

  describe('findOne', () => {
    it('should return membership if found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      membershipsRepository.findOne = jest
        .fn()
        .mockResolvedValue(mockMembership);

      const result = await service.findOne(id);

      expect(membershipsRepository.findOne).toHaveBeenCalledWith({ id });
      expect(result).toEqual({
        id: mockMembership.id,
        userId: mockMembership.userId,
        familyId: mockMembership.familyId,
        permissions: mockMembership.permissions,
        createdAt: new Date(mockMembership.createdAt).toISOString(),
        updatedAt: new Date(mockMembership.updatedAt).toISOString(),
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
        family: {
          id: mockFamily.id,
          name: mockFamily.name,
        },
      });
    });

    it('should throw NotFoundException if membership not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      membershipsRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      expect(membershipsRepository.findOne).toHaveBeenCalledWith({ id });
    });
  });

  describe('update', () => {
    const updateDto: UpdateMembershipDto = {
      permissions: ['family:read'],
    };

    it('should update membership successfully', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      membershipsRepository.findOne = jest
        .fn()
        .mockResolvedValue(mockMembership);
      membershipsRepository.update = jest
        .fn()
        .mockResolvedValue(mockMembership);

      const result = await service.update(id, updateDto);

      expect(membershipsRepository.findOne).toHaveBeenCalledWith({ id });
      expect(membershipsRepository.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if membership not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      membershipsRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(membershipsRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete membership successfully', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      membershipsRepository.findOne = jest
        .fn()
        .mockResolvedValue(mockMembership);
      membershipsRepository.hardDelete = jest.fn().mockResolvedValue(undefined);

      await service.delete(id);

      expect(membershipsRepository.findOne).toHaveBeenCalledWith({ id });
      expect(membershipsRepository.hardDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException if membership not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      membershipsRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.delete(id)).rejects.toThrow(NotFoundException);
      expect(membershipsRepository.hardDelete).not.toHaveBeenCalled();
    });
  });

  describe('findUserMemberships', () => {
    it('should return user memberships successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      usersRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      membershipsRepository.findByUserId = jest
        .fn()
        .mockResolvedValue([mockMembership]);

      const result = await service.findUserMemberships(userId);

      expect(usersRepository.findOne).toHaveBeenCalledWith({ id: userId });
      expect(membershipsRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        memberships: [
          {
            familyId: mockMembership.familyId,
            permissions: mockMembership.permissions,
          },
        ],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      usersRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findUserMemberships(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(membershipsRepository.findByUserId).not.toHaveBeenCalled();
    });
  });

  describe('findFamilyMemberships', () => {
    it('should return account memberships successfully', async () => {
      const familyId = '123e4567-e89b-12d3-a456-426614174002';
      familiesRepository.findOne = jest.fn().mockResolvedValue(mockFamily);
      membershipsRepository.findByFamilyId = jest
        .fn()
        .mockResolvedValue([mockMembership]);

      const result = await service.findFamilyMemberships(familyId);

      expect(familiesRepository.findOne).toHaveBeenCalledWith({
        id: familyId,
      });
      expect(membershipsRepository.findByFamilyId).toHaveBeenCalledWith(
        familyId,
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockMembership.id,
        userId: mockMembership.userId,
        familyId: mockMembership.familyId,
        permissions: mockMembership.permissions,
        createdAt: new Date(mockMembership.createdAt).toISOString(),
        updatedAt: new Date(mockMembership.updatedAt).toISOString(),
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
        family: {
          id: mockFamily.id,
          name: mockFamily.name,
        },
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      const familyId = '123e4567-e89b-12d3-a456-426614174002';
      familiesRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findFamilyMemberships(familyId)).rejects.toThrow(
        NotFoundException,
      );
      expect(membershipsRepository.findByFamilyId).not.toHaveBeenCalled();
    });
  });
});
