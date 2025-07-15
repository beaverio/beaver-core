import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { Response } from 'express';
import { User } from 'src/users/entities/user.entity';
import { IUserService } from 'src/users/interfaces/user-service.interface';
import { ITokenPayload } from './interfaces/token-payload-interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IUserService') private readonly userService: IUserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) { }

  async verifyUser(email: string, password: string): Promise<User> {
    try {
      const user = await this.userService.getUser({ email });
      const authenticated = await compare(password, user.password);
      if (!authenticated) {
        throw new UnauthorizedException()
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException('Credentials are invalid');
    }
  }

  async login(user: User, response: Response) {
    const expirationTime = new Date()
    expirationTime.setMilliseconds(
      expirationTime.getTime() +
      parseInt(this.configService.getOrThrow<string>('JWT_EXPIRATION'))
    )

    const payload: ITokenPayload = {
      sub: user.id,
    }

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: `${this.configService.getOrThrow<string>('JWT_EXPIRATION')}ms`,
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
    });

    response.cookie('authentication', accessToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      expires: expirationTime,
    });
  }
}
