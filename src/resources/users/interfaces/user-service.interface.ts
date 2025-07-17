import { PaginateQuery, Paginated } from 'nestjs-paginate';
import {
  CreateUserDto,
  QueryParamsUserDto,
  UpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';

export interface IUserService {
  createUser(dto: CreateUserDto): Promise<User>;
  getUsers(query?: QueryParamsUserDto): Promise<User[]>;
  getUsersPaginated(query: PaginateQuery): Promise<Paginated<User>>;
  getUser(query: QueryParamsUserDto): Promise<User>;
  updateUser(id: string, dto: UpdateUserDto): Promise<User>;
}
