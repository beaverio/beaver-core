import { CacheInterceptor } from '@nestjs/cache-manager';
import { Body, Controller, Get, Inject, Param, Post, UseInterceptors } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { IUserService } from './interfaces/user.service.interface';

@UseInterceptors(CacheInterceptor)
@Controller('users')
export class UserController {
  constructor(
    @Inject('IUserService') private readonly userService: IUserService
  ) { }

  @Get()
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<User | null> {
    return this.userService.findById(id);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.createUser(createUserDto);
  }
}
