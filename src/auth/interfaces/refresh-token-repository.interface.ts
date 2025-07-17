import { RefreshToken } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository {
  /**
   * Create a new refresh token
   */
  create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    deviceInfo?: string,
  ): Promise<RefreshToken>;

  /**
   * Find a refresh token by user ID and token hash
   */
  findByUserIdAndTokenHash(
    userId: string,
    tokenHash: string,
  ): Promise<RefreshToken | null>;

  /**
   * Find all refresh tokens for a user
   */
  findByUserId(userId: string): Promise<RefreshToken[]>;

  /**
   * Delete a specific refresh token
   */
  deleteByUserIdAndTokenHash(userId: string, tokenHash: string): Promise<void>;

  /**
   * Delete all refresh tokens for a user
   */
  deleteAllByUserId(userId: string): Promise<void>;

  /**
   * Delete expired refresh tokens
   */
  deleteExpired(): Promise<void>;
}
