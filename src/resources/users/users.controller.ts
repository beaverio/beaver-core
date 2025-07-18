import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards
} from '@nestjs/common';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UpdateUserDto, UserResponseDto } from './dto/user.dto';
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
  async getUsers(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<UserResponseDto>> {
    const result = await this.usersService.getUsers(query);
    const transformedData = UserResponseDto.fromEntities(result.data);

    return {
      ...result,
      data: transformedData,
    } as Paginated<UserResponseDto>;
  }

  @Get('self')
  getSelf(@CurrentUser() user: User): UserResponseDto {
    return UserResponseDto.fromEntity(user);
  }

  @Delete('self')
  async deleteUser(@CurrentUser() user: User,): Promise<UserResponseDto> {
    const deletedUser = await this.usersService.deleteUser(user.id);
    return UserResponseDto.fromEntity(deletedUser);
  }

  @Patch('self')
  async updateUser(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.updateUser(user.id, dto);
    return UserResponseDto.fromEntity(updatedUser);
  }

  @Get(':id')
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.getUserById(id);
    return UserResponseDto.fromEntity(user);
  }
}
