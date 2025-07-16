import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { Response } from 'express';
import { CreateUserDto } from 'src/resources/users/dto/user.dto';
import { User } from 'src/resources/users/entities/user.entity';
import { IUserService } from 'src/resources/users/interfaces/user-service.interface';
import { ISessionService } from '../../common/interfaces/session-service.interface';
import { IAuthService } from '../interfaces/auth-service.interface';
import { ITokenPayload } from '../interfaces/token-payload-interface';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject('IUserService')
    private readonly userService: IUserService,
    @Inject('ISessionService')
    private readonly sessionService: ISessionService,
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

      // Then verify against the database
      const user = await this.userService.getUser({ id: userId });
      const authenticated = await compare(
        refreshToken,
        user.refreshToken as string,
      );
      if (!authenticated) {
        throw new UnauthorizedException();
      }
      return user;
    } catch {
      throw new UnauthorizedException('Refresh token is invalid');
    }
  }

  async signup(dto: CreateUserDto): Promise<User> {
    const [existingUser] = await this.userService.getUsers({
      email: dto.email,
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }
    return await this.userService.createUser(dto);
  }

  async signin(user: User, response: Response) {
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

    // Update user with hashed refresh token in database
    await this.userService.updateUserInternal(user.id, {
      refreshToken,
    });

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
    await this.sessionService.revokeSession(userId, refreshToken);
  }

  /**
   * Logout user from all devices by revoking all sessions
   */
  async logoutAllDevices(userId: string): Promise<void> {
    await this.sessionService.revokeAllUserSessions(userId);
  }

  /**
   * Get active session count for a user
   */
  async getActiveSessionCount(userId: string): Promise<number> {
    return await this.sessionService.getActiveSessionCount(userId);
  }
}
