import { Body, ClassSerializerInterceptor, Controller, Get, Inject, Param, Patch, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JWTAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { IUserService } from './interfaces/user-service.interface';

@UseInterceptors(ClassSerializerInterceptor)
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
    return user;
  }

  @UseGuards(JWTAuthGuard)
  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<User> {
    return this.usersService.updateUser(id, dto);
  }
}