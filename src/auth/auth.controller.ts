import {
  Body,
  Controller,
  Inject,
  Post,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  CreateUserDto,
  UserResponseDto,
} from 'src/resources/users/dto/user.dto';
import { User } from 'src/resources/users/entities/user.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JWTAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { IAuthService } from './interfaces/auth-service.interface';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('IAuthService')
    private readonly authService: IAuthService,
  ) { }

  @Post('signup')
  async signUp(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const user = await this.authService.signup(dto);
    await this.authService.signin(user, res);
    return UserResponseDto.fromEntity(user);
  }

  // Attaches the user to the request context, available using the @CurrentUser() decorator
  @UseGuards(LocalAuthGuard)
  @Post('signin')
  async signin(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.signin(user, res);
  }

  // Attaches the user to the request context, available using the @CurrentUser() decorator
  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  async refresh(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.signin(user, res);
  }

  @UseGuards(JWTAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh;
    if (refreshToken) {
      await this.authService.logout(user.id, refreshToken);
    }

    // Clear cookies
    res.clearCookie('authentication');
    res.clearCookie('refresh');

    return { message: 'Logged out successfully' };
  }

  @UseGuards(JWTAuthGuard)
  @Post('logout-all')
  async logoutAll(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAllDevices(user.id);

    // Clear cookies
    res.clearCookie('authentication');
    res.clearCookie('refresh');

    return { message: 'Logged out from all devices successfully' };
  }

  @UseGuards(JWTAuthGuard)
  @Post('sessions/count')
  async getActiveSessionCount(@CurrentUser() user: User) {
    const count = await this.authService.getActiveSessionCount(user.id);
    return { activeSessionCount: count };
  }
}
