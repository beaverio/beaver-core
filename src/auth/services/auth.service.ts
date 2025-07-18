import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { createHash } from 'crypto';
import { Response } from 'express';
import { CreateUserDto } from 'src/resources/users/dto/user.dto';
import { User } from 'src/resources/users/entities/user.entity';
import { IUserService } from 'src/resources/users/interfaces/user-service.interface';
import { ISessionService } from '../../common/interfaces/session-service.interface';
import { IAuthService } from '../interfaces/auth-service.interface';
import { IRefreshTokenRepository } from '../interfaces/refresh-token-repository.interface';
import { ITokenPayload } from '../interfaces/token-payload-interface';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject('IUserService')
    private readonly userService: IUserService,
    @Inject('ISessionService')
    private readonly sessionService: ISessionService,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async verifyUser(email: string, password: string): Promise<User> {
    try {
      const user = await this.userService.getUser({ email });
      const authenticated = await compare(password, user.password);
      if (!authenticated) {
        throw new UnauthorizedException();
      }
      return user;
    } catch {
      throw new UnauthorizedException('Credentials are invalid');
    }
  }

  async verifyRefreshToken(refreshToken: string, userId: string) {
    try {
      // First check if the session is valid in cache (not blacklisted)
      const isSessionValid = await this.sessionService.isSessionValid(
        userId,
        refreshToken,
      );
      if (!isSessionValid) {
        throw new UnauthorizedException('Session has been revoked');
      }

      // Hash the refresh token to match stored hash
      const tokenHash = this.getTokenHash(refreshToken);

      // Find the refresh token in the database
      const storedToken =
        await this.refreshTokenRepository.findByUserIdAndTokenHash(
          userId,
          tokenHash,
        );

      if (!storedToken) {
        throw new UnauthorizedException('Refresh token not found');
      }

      // Check if token has expired
      if (storedToken.expiresAt < new Date()) {
        // Clean up expired token
        await this.refreshTokenRepository.deleteByUserIdAndTokenHash(
          userId,
          tokenHash,
        );
        throw new UnauthorizedException('Refresh token has expired');
      }

      // Get and return the user
      const user = await this.userService.getUser({ id: userId });
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Refresh token is invalid');
    }
  }

  async signup(dto: CreateUserDto): Promise<User> {
    // Use the findOne method instead of paginated search for checking existence
    try {
      const existingUser = await this.userService.getUser({
        email: dto.email,
      });

      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    } catch (error) {
      // User not found is expected, continue with signup
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    return await this.userService.createUser(dto);
  }

  async signin(user: User, response: Response) {
    // Update last login timestamp
    await this.userService.updateLastLogin(user.id);

    const expirationAccessToken = new Date();
    expirationAccessToken.setSeconds(
      expirationAccessToken.getSeconds() +
        parseInt(
          this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRATION'),
        ),
    );

    const expirationRefreshToken = new Date();
    expirationRefreshToken.setSeconds(
      expirationRefreshToken.getSeconds() +
        parseInt(
          this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRATION'),
        ),
    );

    const payload: ITokenPayload = {
      sub: user.id,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: parseInt(
        this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRATION'),
      ),
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: parseInt(
        this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRATION'),
      ),
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });

    // Hash and store refresh token in database
    const tokenHash = this.getTokenHash(refreshToken);
    await this.refreshTokenRepository.create(
      user.id,
      tokenHash,
      expirationRefreshToken,
    );

    // Store session in cache for revocation capabilities
    await this.sessionService.storeSession(
      user.id,
      refreshToken,
      expirationRefreshToken,
    );

    response.cookie('authentication', accessToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      expires: expirationAccessToken,
    });

    response.cookie('refresh', refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      expires: expirationRefreshToken,
    });
  }

  /**
   * Logout a user by revoking their refresh token session
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    // Revoke from cache
    await this.sessionService.revokeSession(userId, refreshToken);

    // Remove from database
    const tokenHash = this.getTokenHash(refreshToken);
    await this.refreshTokenRepository.deleteByUserIdAndTokenHash(
      userId,
      tokenHash,
    );
  }

  /**
   * Logout user from all devices by revoking all sessions
   */
  async logoutAllDevices(userId: string): Promise<void> {
    // Revoke all sessions from cache
    await this.sessionService.revokeAllUserSessions(userId);

    // Remove all refresh tokens from database
    await this.refreshTokenRepository.deleteAllByUserId(userId);
  }

  /**
   * Get active session count for a user
   */
  /**
   * Get active session count for a user
   */
  async getActiveSessionCount(userId: string): Promise<number> {
    return await this.sessionService.getActiveSessionCount(userId);
  }

  private getTokenHash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
