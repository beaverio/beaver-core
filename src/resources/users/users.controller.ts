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
  CursorPaginationQueryDto,
  CursorPaginatedResponseDto,
} from 'src/common/dto/cursor-pagination.dto';
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
    @Query() query: QueryParamsUserDto,
    @Query() paginationQuery: CursorPaginationQueryDto,
  ): Promise<UserResponseDto[] | CursorPaginatedResponseDto<UserResponseDto>> {
    // Check if pagination parameters are provided
    const isPaginated =
      paginationQuery.cursor !== undefined ||
      paginationQuery.limit !== undefined;

    if (isPaginated) {
      // Use cursor pagination
      const cursorResult = await this.usersService.getUsersCursor(
        paginationQuery,
        query,
      );

      // Transform User entities to UserResponseDto
      const transformedData = UserResponseDto.fromEntities(cursorResult.data);

      // Return cursor paginated response
      return new CursorPaginatedResponseDto(
        transformedData,
        cursorResult.nextCursor,
        cursorResult.prevCursor,
        cursorResult.hasNext,
        cursorResult.hasPrevious,
        cursorResult.total,
      );
    } else {
      // Existing behavior for non-paginated requests
      const users = await this.usersService.getUsers(query);
      return UserResponseDto.fromEntities(users);
    }
  }

  @Get('cursor')
  async getUsersCursor(
    @Query() query: QueryParamsUserDto,
    @Query() paginationQuery: CursorPaginationQueryDto,
  ): Promise<CursorPaginatedResponseDto<UserResponseDto>> {
    // Explicit cursor-based pagination endpoint for demonstration
    // This shows how cursor pagination would work for high-volume entities like Transactions
    const cursorResult = await this.usersService.getUsersCursor(
      paginationQuery,
      query,
    );

    // Transform User entities to UserResponseDto
    const transformedData = UserResponseDto.fromEntities(cursorResult.data);

    // Return cursor paginated response
    return new CursorPaginatedResponseDto(
      transformedData,
      cursorResult.nextCursor,
      cursorResult.prevCursor,
      cursorResult.hasNext,
      cursorResult.hasPrevious,
      cursorResult.total,
    );
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
