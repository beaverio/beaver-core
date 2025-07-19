import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserMembershipsResponseDto } from '../memberships/dto/membership.dto';
import { IMembershipsService } from '../memberships/interfaces/memberships-service.interface';
import { UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { IUserService } from './interfaces/users-service.interface';

@UseGuards(JWTAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    @Inject('IUserService')
    private readonly usersService: IUserService,
    @Inject('IMembershipsService')
    private readonly membershipsService: IMembershipsService,
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
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@CurrentUser() user: User): Promise<void> {
    await this.usersService.deleteUser(user.id);
  }

  @Patch('self')
  async updateUser(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.updateUser(user.id, dto);
    return UserResponseDto.fromEntity(updatedUser);
  }

  @Get(':userId/memberships')
  async getUserMemberships(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<UserMembershipsResponseDto> {
    return this.membershipsService.findUserMemberships(userId);
  }
}
