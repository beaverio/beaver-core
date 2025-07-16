import { Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { User } from "src/resources/users/entities/user.entity";
import { IAuthService } from "../interfaces/auth-service.interface";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(
    @Inject('IAuthService')
    private readonly authService: IAuthService
  ) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<User> {
    return this.authService.verifyUser(email, password)
  }
}