import { Body, Controller, Get, Inject, Post, Request, UseGuards } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { IUserService } from './interfaces/user-service.interface';
import { JWTAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(
    @Inject('IUserService')
    private readonly usersService: IUserService,
  ) { }

  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.createUser(dto);
  }

  @UseGuards(JWTAuthGuard)
  @Get()
  async getUsers(): Promise<User[]> {
    return await this.usersService.getUsers()
  }

  @UseGuards(JWTAuthGuard)
  @Get('self')
  async getSelf(@CurrentUser() user: User): Promise<User> {
    return user
  }
}