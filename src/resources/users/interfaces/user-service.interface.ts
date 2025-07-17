import {
  CreateUserDto,
  QueryParamsUserDto,
  UpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';
import {
  IPaginationOptions,
  IPaginatedResult,
} from '../../../common/interfaces/pagination.interface';

export interface IUserService {
  createUser(dto: CreateUserDto): Promise<User>;
  getUsers(query?: QueryParamsUserDto): Promise<User[]>;
  getUsersPaginated(
    options: IPaginationOptions,
    query?: QueryParamsUserDto,
  ): Promise<IPaginatedResult<User>>;
  getUser(query: QueryParamsUserDto): Promise<User>;
  updateUser(id: string, dto: UpdateUserDto): Promise<User>;
}
