import {
  CreateUserDto,
  QueryParamsUserDto,
  UpdateUserDto,
  InternalUpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';

export interface IUserService {
  createUser(dto: CreateUserDto): Promise<User>;
  getUsers(query?: QueryParamsUserDto): Promise<User[]>;
  getUser(query: QueryParamsUserDto): Promise<User>;
  updateUser(id: string, dto: UpdateUserDto): Promise<User>;
  updateUserInternal(id: string, dto: InternalUpdateUserDto): Promise<User>;
}
