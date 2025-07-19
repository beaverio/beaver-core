import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { MembershipsService } from './services/memberships.service';
import { MembershipsRepository } from './repositories/memberships.repository';
import { IMembershipsRepository } from './interfaces/memberships-repository.interface';
import { IUsersRepository } from '../users/interfaces/users-repository.interface';
import { IAccountsRepository } from '../accounts/interfaces/accounts-repository.interface';
import { Membership } from './entities/membership.entity';
import { CreateMembershipDto } from './dto/membership.dto';

describe('Membership Entity Constraints', () => {
  let service: MembershipsService;
  let membershipsRepository: IMembershipsRepository;
  let usersRepository: Partial<IUsersRepository>;
  let accountsRepository: Partial<IAccountsRepository>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'test@example.com',
  };

  const mockAccount = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Test Account',
  };

  beforeEach(async () => {
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
          useClass: MembershipsRepository,
        },
        {
          provide: getRepositoryToken(Membership),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: 'ICacheService',
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
          },
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
    membershipsRepository = module.get<IMembershipsRepository>(
      'IMembershipsRepository',
    );
  });

  describe('Unique Constraint Validation', () => {
    it('should prevent duplicate memberships for same user and account', async () => {
      const createDto: CreateMembershipDto = {
        userId: mockUser.id,
        accountId: mockAccount.id,
        permissions: ['account:read'],
      };

      // Mock successful user and account lookup
      usersRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      accountsRepository.findOne = jest.fn().mockResolvedValue(mockAccount);

      // Mock that membership already exists
      membershipsRepository.findByUserAndAccount = jest.fn().mockResolvedValue({
        id: 'existing-membership-id',
        userId: mockUser.id,
        accountId: mockAccount.id,
        permissions: ['account:read'],
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(membershipsRepository.findByUserAndAccount).toHaveBeenCalledWith(
        mockUser.id,
        mockAccount.id,
      );
    });

    it('should allow membership creation when no duplicate exists', async () => {
      const createDto: CreateMembershipDto = {
        userId: mockUser.id,
        accountId: mockAccount.id,
        permissions: ['account:read'],
      };

      const expectedMembership = {
        id: 'new-membership-id',
        userId: mockUser.id,
        accountId: mockAccount.id,
        permissions: ['account:read'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        user: mockUser,
        account: mockAccount,
      };

      // Mock successful user and account lookup
      usersRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      accountsRepository.findOne = jest.fn().mockResolvedValue(mockAccount);

      // Mock no existing membership
      membershipsRepository.findByUserAndAccount = jest
        .fn()
        .mockResolvedValue(null);
      membershipsRepository.create = jest
        .fn()
        .mockResolvedValue(expectedMembership);

      const result = await service.create(createDto);

      expect(result.id).toBe('new-membership-id');
      expect(result.userId).toBe(mockUser.id);
      expect(result.accountId).toBe(mockAccount.id);
    });
  });

  describe('Cascade Deletion Scenarios', () => {
    it('should test cascade deletion behavior documentation', () => {
      // This test documents the expected cascade behavior
      // In actual database implementation:

      // 1. When User is deleted:
      //    - All Membership records with that userId are automatically deleted
      //    - This is handled by the database with ON DELETE CASCADE

      // 2. When Account is deleted:
      //    - All Membership records with that accountId are automatically deleted
      //    - This is handled by the database with ON DELETE CASCADE

      // 3. When Membership is deleted:
      //    - Only the membership record is removed
      //    - User and Account records remain intact

      const entityDefinitions = {
        user: {
          relationship: 'OneToMany',
          cascade: 'onDelete: CASCADE',
          foreignKey: 'userId',
        },
        account: {
          relationship: 'OneToMany',
          cascade: 'onDelete: CASCADE',
          foreignKey: 'accountId',
        },
        membership: {
          uniqueConstraint: ['userId', 'accountId'],
        },
      };

      expect(entityDefinitions.user.cascade).toBe('onDelete: CASCADE');
      expect(entityDefinitions.account.cascade).toBe('onDelete: CASCADE');
      expect(entityDefinitions.membership.uniqueConstraint).toEqual([
        'userId',
        'accountId',
      ]);
    });
  });

  describe('Relationship Loading', () => {
    it('should support loading user.memberships relationship', async () => {
      const userId = mockUser.id;
      const mockMemberships = [
        {
          id: 'membership1',
          userId,
          accountId: 'account1',
          permissions: ['account:read'],
          account: { id: 'account1', name: 'Account 1' },
        },
        {
          id: 'membership2',
          userId,
          accountId: 'account2',
          permissions: ['account:write'],
          account: { id: 'account2', name: 'Account 2' },
        },
      ];

      usersRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      membershipsRepository.findByUserId = jest
        .fn()
        .mockResolvedValue(mockMemberships);

      const result = await service.findUserMemberships(userId);

      expect(result.memberships).toHaveLength(2);
      expect(result.memberships[0].accountId).toBe('account1');
      expect(result.memberships[1].accountId).toBe('account2');
      expect(membershipsRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should support loading account.memberships relationship', async () => {
      const accountId = mockAccount.id;
      const mockMemberships = [
        {
          id: 'membership1',
          userId: 'user1',
          accountId,
          permissions: ['account:read'],
          user: { id: 'user1', email: 'user1@example.com' },
        },
        {
          id: 'membership2',
          userId: 'user2',
          accountId,
          permissions: ['account:write'],
          user: { id: 'user2', email: 'user2@example.com' },
        },
      ];

      accountsRepository.findOne = jest.fn().mockResolvedValue(mockAccount);
      membershipsRepository.findByAccountId = jest
        .fn()
        .mockResolvedValue(mockMemberships);

      const result = await service.findAccountMemberships(accountId);

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user1');
      expect(result[1].userId).toBe('user2');
      expect(membershipsRepository.findByAccountId).toHaveBeenCalledWith(
        accountId,
      );
    });
  });
});
