import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ITokenPayload } from "../interfaces/token-payload-interface";
import { Request } from "express";
import { AuthService } from "../auth.service";

@Injectable()
export class JWTRefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request.cookies?.refresh
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true, // Allows us to access the request object in validate
    })
  }

  async validate(request: Request, payload: ITokenPayload) {
    return await this.authService.verifyRefreshToken(
      request.cookies?.refresh,
      payload.sub
    );
  }
}
