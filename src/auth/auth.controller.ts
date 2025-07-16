import { Body, Controller, Inject, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import {
  CreateUserDto,
  UserResponseDto,
} from 'src/resources/users/dto/user.dto';
import { User } from 'src/resources/users/entities/user.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LocalAuthGuard } from './gaurds/local-auth.guard';
import { RefreshAuthGuard } from './gaurds/refresh-auth.guard';
import { IAuthService } from './interfaces/auth-service.interface';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('IAuthService')
    private readonly authService: IAuthService,
  ) {}

  @Post('signup')
  async signUp(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const user = await this.authService.signup(dto);
    await this.authService.signin(user, res);
    return UserResponseDto.fromEntity(user);
  }

  @UseGuards(LocalAuthGuard)
  @Post('signin')
  async signin(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.signin(user, res);
  }

  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  async refresh(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.signin(user, res);
  }
}
