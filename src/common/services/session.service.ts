import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { ICacheService } from '../interfaces/cache-service.interface';
import { ISessionService } from '../interfaces/session-service.interface';

@Injectable()
export class SessionService implements ISessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  constructor(
    @Inject('ICacheService')
    private readonly cacheService: ICacheService,
  ) { }

  async storeSession(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
  ): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(userId, refreshToken);
      const userSessionsKey = this.getUserSessionsKey(userId);

      // Store the session with expiration
      const ttl = expiresAt.getTime() - Date.now();
      await this.cacheService.set(
        sessionKey,
        {
          userId,
          refreshToken,
          createdAt: new Date(),
          expiresAt,
        },
        ttl > 0 ? ttl : this.DEFAULT_TTL,
      );

      // Add to user's active sessions list
      const userSessions =
        (await this.cacheService.get<string[]>(userSessionsKey)) || [];
      if (!userSessions.includes(sessionKey)) {
        userSessions.push(sessionKey);
        await this.cacheService.set(
          userSessionsKey,
          userSessions,
          ttl > 0 ? ttl : this.DEFAULT_TTL,
        );
      }

      this.logger.debug(`Session stored for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error storing session for user ${userId}:`, error);
      throw error;
    }
  }

  async isSessionValid(userId: string, refreshToken: string): Promise<boolean> {
    try {
      const sessionKey = this.getSessionKey(userId, refreshToken);
      const session = await this.cacheService.get(sessionKey);

      if (!session) {
        this.logger.debug(`Session not found for user ${userId}`);
        return false;
      }

      this.logger.debug(`Session found and valid for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error validating session for user ${userId}:`, error);
      return false;
    }
  }

  async revokeSession(userId: string, refreshToken: string): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(userId, refreshToken);
      const userSessionsKey = this.getUserSessionsKey(userId);

      // Remove the specific session
      await this.cacheService.delete(sessionKey);

      // Remove from user's sessions list
      const userSessions =
        (await this.cacheService.get<string[]>(userSessionsKey)) || [];
      const updatedSessions = userSessions.filter((key) => key !== sessionKey);

      if (updatedSessions.length > 0) {
        await this.cacheService.set(userSessionsKey, updatedSessions);
      } else {
        await this.cacheService.delete(userSessionsKey);
      }

      this.logger.debug(`Session revoked for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error revoking session for user ${userId}:`, error);
      throw error;
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      const userSessionsKey = this.getUserSessionsKey(userId);
      const userSessions =
        (await this.cacheService.get<string[]>(userSessionsKey)) || [];

      // Delete all user sessions
      for (const sessionKey of userSessions) {
        await this.cacheService.delete(sessionKey);
      }

      // Delete the user sessions list
      await this.cacheService.delete(userSessionsKey);

      this.logger.debug(`All sessions revoked for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error revoking all sessions for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  cleanupExpiredSessions(): Promise<void> {
    try {
      // This is a simplified cleanup. In production, you might want to use Redis expiration
      // or implement a more sophisticated cleanup strategy
      this.logger.debug(
        'Cleanup expired sessions - automatic expiration handles this',
      );
      return Promise.resolve();
    } catch (error) {
      this.logger.error('Error during session cleanup:', error);
      return Promise.resolve();
    }
  }

  async getActiveSessionCount(userId: string): Promise<number> {
    try {
      const userSessionsKey = this.getUserSessionsKey(userId);
      const userSessions =
        (await this.cacheService.get<string[]>(userSessionsKey)) || [];

      // Verify sessions still exist (clean up stale references)
      let activeCount = 0;
      const validSessions: string[] = [];

      for (const sessionKey of userSessions) {
        const session = await this.cacheService.get(sessionKey);
        if (session) {
          activeCount++;
          validSessions.push(sessionKey);
        }
      }

      // Update the sessions list if it changed
      if (validSessions.length !== userSessions.length) {
        if (validSessions.length > 0) {
          await this.cacheService.set(userSessionsKey, validSessions);
        } else {
          await this.cacheService.delete(userSessionsKey);
        }
      }

      return activeCount;
    } catch (error) {
      this.logger.error(
        `Error getting active session count for user ${userId}:`,
        error,
      );
      return 0;
    }
  }

  private getSessionKey(userId: string, refreshToken: string): string {
    // Use a hash of the refresh token for the key to avoid storing the actual token
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    return `${this.SESSION_PREFIX}${userId}:${tokenHash}`;
  }

  private getUserSessionsKey(userId: string): string {
    return `${this.USER_SESSIONS_PREFIX}${userId}`;
  }
}
