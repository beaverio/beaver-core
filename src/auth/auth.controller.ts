import { Body, ClassSerializerInterceptor, Controller, Inject, Post, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { plainToClass } from 'class-transformer';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entities/user.entity';
import { CurrentUser } from './decorators/current-user.decorator';
import { LocalAuthGuard } from './gaurds/local-auth.guard';
import { RefreshAuthGuard } from './gaurds/refresh-auth.guard';
import { IAuthService } from './interfaces/auth-service.interface';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('IAuthService')
    private readonly authService: IAuthService,
  ) { }

  @Post('signup')
  async signUp(@Body() dto: CreateUserDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.signup(dto);
    await this.authService.signin(user, res);
    return user;
  }

  @UseGuards(LocalAuthGuard)
  @Post('signin')
  async signin(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    return await this.authService.signin(user, res);
  }

  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  async refresh(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    return await this.authService.signin(user, res);
  }
}
