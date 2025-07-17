import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
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
    @Paginate() paginateQuery: PaginateQuery,
  ): Promise<UserResponseDto[] | any> {
    // Check if pagination parameters are provided
    const isPaginated = paginateQuery.page !== undefined || paginateQuery.limit !== undefined || paginateQuery.cursor !== undefined;

    if (isPaginated) {
      // Use nestjs-paginate for paginated requests
      // Automatically chooses between offset-based and cursor-based pagination
      const paginatedResult = await this.usersService.getUsersPaginated(paginateQuery);
      
      // Transform User entities to UserResponseDto
      const transformedData = UserResponseDto.fromEntities(paginatedResult.data);
      
      // Return the result with transformed data (using any type to avoid type conflicts)
      return {
        ...paginatedResult,
        data: transformedData,
      };
    } else {
      // Existing behavior for non-paginated requests
      const users = await this.usersService.getUsers(query);
      return UserResponseDto.fromEntities(users);
    }
  }

  @Get('cursor')
  async getUsersCursor(
    @Paginate() paginateQuery: PaginateQuery,
  ): Promise<any> {
    // Explicit cursor-based pagination endpoint for demonstration
    // This shows how cursor pagination would work for high-volume entities like Transactions
    const paginatedResult = await this.usersService.getUsersCursorPaginated(paginateQuery);
    
    // Transform User entities to UserResponseDto
    const transformedData = UserResponseDto.fromEntities(paginatedResult.data);
    
    // Return the result with transformed data
    return {
      ...paginatedResult,
      data: transformedData,
    };
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
