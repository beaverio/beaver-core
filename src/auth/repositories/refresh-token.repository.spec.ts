import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RefreshTokenRepository } from './refresh-token.repository';

describe('RefreshTokenRepository', () => {
  let repository: RefreshTokenRepository;
  let mockRepository: jest.Mocked<Repository<RefreshToken>>;

  const mockRefreshToken = {
    id: 'token-id',
    userId: 'user-id',
    tokenHash: 'hashed-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    deviceInfo: 'Test Device',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenRepository,
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRepo,
        },
      ],
    }).compile();

    repository = module.get<RefreshTokenRepository>(RefreshTokenRepository);
    mockRepository = module.get(getRepositoryToken(RefreshToken));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new refresh token', async () => {
      const userId = 'user-123';
      const tokenHash = 'hash-123';
      const expiresAt = new Date();
      const deviceInfo = 'iPhone';

      mockRepository.create.mockReturnValue(mockRefreshToken as any);
      mockRepository.save.mockResolvedValue(mockRefreshToken as any);

      const result = await repository.create(
        userId,
        tokenHash,
        expiresAt,
        deviceInfo,
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        tokenHash,
        expiresAt,
        deviceInfo,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockRefreshToken);
      expect(result).toEqual(mockRefreshToken);
    });
  });

  describe('findByUserIdAndTokenHash', () => {
    it('should find a refresh token by user ID and token hash', async () => {
      const userId = 'user-123';
      const tokenHash = 'hash-123';

      mockRepository.findOne.mockResolvedValue(mockRefreshToken as any);

      const result = await repository.findByUserIdAndTokenHash(
        userId,
        tokenHash,
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId, tokenHash },
      });
      expect(result).toEqual(mockRefreshToken);
    });

    it('should return null if token not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByUserIdAndTokenHash(
        'user-123',
        'hash-123',
      );

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all refresh tokens for a user', async () => {
      const userId = 'user-123';
      const tokens = [mockRefreshToken, { ...mockRefreshToken, id: 'token-2' }];

      mockRepository.find.mockResolvedValue(tokens as any);

      const result = await repository.findByUserId(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(tokens);
    });
  });

  describe('deleteByUserIdAndTokenHash', () => {
    it('should delete a specific refresh token', async () => {
      const userId = 'user-123';
      const tokenHash = 'hash-123';

      await repository.deleteByUserIdAndTokenHash(userId, tokenHash);

      expect(mockRepository.delete).toHaveBeenCalledWith({ userId, tokenHash });
    });
  });

  describe('deleteAllByUserId', () => {
    it('should delete all refresh tokens for a user', async () => {
      const userId = 'user-123';

      await repository.deleteAllByUserId(userId);

      expect(mockRepository.delete).toHaveBeenCalledWith({ userId });
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired refresh tokens', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 5 }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await repository.deleteExpired();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('expiresAt < :now', {
        now: expect.any(Date),
      });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });
});
