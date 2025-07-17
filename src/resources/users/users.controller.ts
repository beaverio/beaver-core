import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  PaginationQueryDto,
  PaginatedResponseDto,
} from 'src/common/dto/pagination.dto';
import {
  QueryParamsUserDto,
  UpdateUserDto,
  UserResponseDto,
} from './dto/user.dto';
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
    @Query() query: QueryParamsUserDto & PaginationQueryDto,
  ): Promise<UserResponseDto[] | PaginatedResponseDto<UserResponseDto>> {
    // Check if pagination parameters are provided
    const isPaginated = query.page !== undefined || query.limit !== undefined;

    if (isPaginated) {
      // Extract pagination options
      const paginationOptions = {
        page: query.page || 1,
        limit: query.limit || 10,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      };

      // Extract filter options (exclude pagination fields)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { page, limit, sortBy, sortOrder, ...filterQuery } = query;
      const whereQuery =
        Object.keys(filterQuery).length > 0 ? filterQuery : undefined;

      const paginatedResult = await this.usersService.getUsersPaginated(
        paginationOptions,
        whereQuery,
      );
      const userResponseDtos = UserResponseDto.fromEntities(
        paginatedResult.data,
      );

      return PaginatedResponseDto.fromPaginatedResult({
        ...paginatedResult,
        data: userResponseDtos,
      });
    } else {
      // Existing behavior for non-paginated requests
      const users = await this.usersService.getUsers(query);
      return UserResponseDto.fromEntities(users);
    }
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
