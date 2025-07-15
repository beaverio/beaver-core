import { Body, Controller, Inject, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { IUserService } from './interfaces/user-service.interface';

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
}