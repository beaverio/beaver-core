import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../interfaces/refresh-token-repository.interface';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    deviceInfo?: string,
  ): Promise<RefreshToken> {
    const refreshToken = this.refreshTokenRepository.create({
      userId,
      tokenHash,
      expiresAt,
      deviceInfo,
    });

    return await this.refreshTokenRepository.save(refreshToken);
  }

  async findByUserIdAndTokenHash(
    userId: string,
    tokenHash: string,
  ): Promise<RefreshToken | null> {
    return await this.refreshTokenRepository.findOne({
      where: { userId, tokenHash },
    });
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    return await this.refreshTokenRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteByUserIdAndTokenHash(
    userId: string,
    tokenHash: string,
  ): Promise<void> {
    await this.refreshTokenRepository.delete({ userId, tokenHash });
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.refreshTokenRepository.delete({ userId });
  }

  async deleteExpired(): Promise<void> {
    await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }
}
