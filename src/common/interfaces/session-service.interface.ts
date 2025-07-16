/**
 * Session service interface for managing user sessions and token blacklisting
 */
export interface ISessionService {
  /**
   * Store a refresh token session
   * @param userId User ID
   * @param refreshToken Refresh token
   * @param expiresAt Expiration timestamp
   */
  storeSession(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
  ): Promise<void>;

  /**
   * Validate if a refresh token session is active
   * @param userId User ID
   * @param refreshToken Refresh token
   * @returns Promise resolving to true if session is valid
   */
  isSessionValid(userId: string, refreshToken: string): Promise<boolean>;

  /**
   * Revoke a specific refresh token session
   * @param userId User ID
   * @param refreshToken Refresh token to revoke
   */
  revokeSession(userId: string, refreshToken: string): Promise<void>;

  /**
   * Revoke all sessions for a user (logout from all devices)
   * @param userId User ID
   */
  revokeAllUserSessions(userId: string): Promise<void>;

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): Promise<void>;

  /**
   * Get active session count for a user
   * @param userId User ID
   * @returns Promise resolving to number of active sessions
   */
  getActiveSessionCount(userId: string): Promise<number>;
}
