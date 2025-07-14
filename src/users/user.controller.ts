import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { IUserService } from './interfaces/user.service.interface';

@Controller('users')
export class UserController {
  constructor(
    @Inject('IUserService') private readonly userService: IUserService
  ) { }

  @Get()
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.createUser(createUserDto);
  }
}
