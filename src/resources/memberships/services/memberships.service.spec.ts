import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { IMembershipsRepository } from '../interfaces/memberships-repository.interface';
import { IUsersRepository } from '../../users/interfaces/users-repository.interface';
import { IAccountsRepository } from '../../accounts/interfaces/accounts-repository.interface';
import { MembershipsService } from './memberships.service';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
} from '../dto/membership.dto';
import { Membership } from '../entities/membership.entity';
import { User } from '../../users/entities/user.entity';
import { Account } from '../../accounts/entities/account.entity';

describe('MembershipsService', () => {
  let service: MembershipsService;
  let membershipsRepository: Partial<IMembershipsRepository>;
  let usersRepository: Partial<IUsersRepository>;
  let accountsRepository: Partial<IAccountsRepository>;

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

  const mockAccount: Account = {
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
    accountId: mockAccount.id,
    permissions: ['account:read', 'account:write'],
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
    account: mockAccount,
  };

  beforeEach(async () => {
    membershipsRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      hardDelete: jest.fn(),
      findByUserId: jest.fn(),
      findByAccountId: jest.fn(),
      findByUserAndAccount: jest.fn(),
    };

    usersRepository = {
      findOne: jest.fn(),
    };

    accountsRepository = {
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
          provide: 'IAccountsRepository',
          useValue: accountsRepository,
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
      accountId: mockAccount.id,
      permissions: ['account:read', 'account:write'],
    };

    it('should create a membership successfully', async () => {
      usersRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      accountsRepository.findOne = jest.fn().mockResolvedValue(mockAccount);
      membershipsRepository.findByUserAndAccount = jest
        .fn()
        .mockResolvedValue(null);
      membershipsRepository.create = jest
        .fn()
        .mockResolvedValue(mockMembership);

      const result = await service.create(createDto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        id: createDto.userId,
      });
      expect(accountsRepository.findOne).toHaveBeenCalledWith({
        id: createDto.accountId,
      });
      expect(membershipsRepository.findByUserAndAccount).toHaveBeenCalledWith(
        createDto.userId,
        createDto.accountId,
      );
      expect(membershipsRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({
        id: mockMembership.id,
        userId: mockMembership.userId,
        accountId: mockMembership.accountId,
        permissions: mockMembership.permissions,
        createdAt: new Date(mockMembership.createdAt).toISOString(),
        updatedAt: new Date(mockMembership.updatedAt).toISOString(),
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
        account: {
          id: mockAccount.id,
          name: mockAccount.name,
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
      expect(accountsRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if account not found', async () => {
      usersRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      accountsRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(accountsRepository.findOne).toHaveBeenCalledWith({
        id: createDto.accountId,
      });
    });

    it('should throw ConflictException if membership already exists', async () => {
      usersRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      accountsRepository.findOne = jest.fn().mockResolvedValue(mockAccount);
      membershipsRepository.findByUserAndAccount = jest
        .fn()
        .mockResolvedValue(mockMembership);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(membershipsRepository.findByUserAndAccount).toHaveBeenCalledWith(
        createDto.userId,
        createDto.accountId,
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
        accountId: mockMembership.accountId,
        permissions: mockMembership.permissions,
        createdAt: new Date(mockMembership.createdAt).toISOString(),
        updatedAt: new Date(mockMembership.updatedAt).toISOString(),
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
        account: {
          id: mockAccount.id,
          name: mockAccount.name,
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
      permissions: ['account:read'],
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
            accountId: mockMembership.accountId,
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

  describe('findAccountMemberships', () => {
    it('should return account memberships successfully', async () => {
      const accountId = '123e4567-e89b-12d3-a456-426614174002';
      accountsRepository.findOne = jest.fn().mockResolvedValue(mockAccount);
      membershipsRepository.findByAccountId = jest
        .fn()
        .mockResolvedValue([mockMembership]);

      const result = await service.findAccountMemberships(accountId);

      expect(accountsRepository.findOne).toHaveBeenCalledWith({
        id: accountId,
      });
      expect(membershipsRepository.findByAccountId).toHaveBeenCalledWith(
        accountId,
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockMembership.id,
        userId: mockMembership.userId,
        accountId: mockMembership.accountId,
        permissions: mockMembership.permissions,
        createdAt: new Date(mockMembership.createdAt).toISOString(),
        updatedAt: new Date(mockMembership.updatedAt).toISOString(),
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
        account: {
          id: mockAccount.id,
          name: mockAccount.name,
        },
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      const accountId = '123e4567-e89b-12d3-a456-426614174002';
      accountsRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findAccountMemberships(accountId)).rejects.toThrow(
        NotFoundException,
      );
      expect(membershipsRepository.findByAccountId).not.toHaveBeenCalled();
    });
  });
});
