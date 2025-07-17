import {
  ICursorPaginationOptions,
  ICursorPaginatedResult,
} from 'src/common/interfaces/cursor-pagination.interface';
import {
  CreateUserDto,
  QueryParamsUserDto,
  UpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';

export interface IUserService {
  createUser(dto: CreateUserDto): Promise<User>;
  getUsers(query?: QueryParamsUserDto): Promise<User[]>;
  getUsersCursor(
    options: ICursorPaginationOptions,
    query?: QueryParamsUserDto,
  ): Promise<ICursorPaginatedResult<User>>;
  getUser(query: QueryParamsUserDto): Promise<User>;
  updateUser(id: string, dto: UpdateUserDto): Promise<User>;
}
