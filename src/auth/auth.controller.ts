import { Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { User } from 'src/users/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LocalAuthGuard } from './gaurds/local-auth.guard';
import { RefreshAuthGuard } from './gaurds/refresh-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    return await this.authService.login(user, res);
  }

  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  async refresh(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    return await this.authService.login(user, res);
  }
}
