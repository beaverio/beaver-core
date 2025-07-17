import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/resources/users/entities/user.entity';
import { IAuthService } from '../interfaces/auth-service.interface';
import { ITokenPayload } from '../interfaces/token-payload-interface';

@Injectable()
export class JWTRefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(
    @Inject('IAuthService')
    private readonly authService: IAuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request.cookies?.refresh as string,
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true, // Allows us to access the request object in validate
    });
  }

  async validate(request: Request, payload: ITokenPayload): Promise<User> {
    const refreshToken = request.cookies?.refresh as string;
    return await this.authService.verifyRefreshToken(refreshToken, payload.sub);
  }
}
