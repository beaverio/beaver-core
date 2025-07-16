import { Body, ClassSerializerInterceptor, Controller, Get, Inject, Param, Patch, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JWTAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { GetUsersQueryDto } from './dto/query-params-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { IUserService } from './interfaces/user-service.interface';

@UseGuards(JWTAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    @Inject('IUserService')
    private readonly usersService: IUserService,
  ) { }

  @Get()
  async getUsers(@Query() query: GetUsersQueryDto): Promise<User[]> {
    return await this.usersService.getUsers(query)
  }

  @Get('self')
  async getSelf(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<User> {
    return this.usersService.updateUser(id, dto);
  }
}