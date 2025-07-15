import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JWTRefreshStrategy } from './strategies/refresh.strategy';

@Module({
  imports: [UsersModule, PassportModule, JwtModule],
  controllers: [AuthController],
  providers: [
    {
      provide: 'IAuthService',
      useClass: AuthService,
    },
    LocalStrategy,
    JwtStrategy,
    JWTRefreshStrategy,
  ],
})
export class AuthModule { }
