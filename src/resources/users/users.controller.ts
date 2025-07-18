import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  UseGuards,
  ForbiddenException,
  ParseUUIDPipe,
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

  @Get(':id')
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.getUserById(id);
    return UserResponseDto.fromEntity(user);
  }

  @Patch(':id')
  async updateUser(
    @CurrentUser() currentUser: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    if (currentUser.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const updatedUser = await this.usersService.updateUser(id, dto);
    return UserResponseDto.fromEntity(updatedUser);
  }

  @Delete(':id')
  async deleteUser(
    @CurrentUser() currentUser: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    if (currentUser.id !== id) {
      throw new ForbiddenException('You can only delete your own profile');
    }

    const deletedUser = await this.usersService.deleteUser(id);
    return UserResponseDto.fromEntity(deletedUser);
  }
}
