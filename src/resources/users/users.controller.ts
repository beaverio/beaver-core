import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  UseGuards,
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
  ) {}

  @Get()
  async getUsers(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<UserResponseDto>> {
    // Always use pagination with default limit of 50
    const result = await this.usersService.getUsers(query);

    // Transform User entities to UserResponseDto
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

  @Patch(':id')
  async updateUser(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.updateUser(user.id, dto);
    return UserResponseDto.fromEntity(updatedUser);
  }
}
