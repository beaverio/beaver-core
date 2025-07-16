import {
  CreateUserDto,
  GetUsersQueryDto,
  UpdateUserDto,
  InternalUpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';

export interface IUserService {
  createUser(dto: CreateUserDto): Promise<User>;
  getUsers(query?: GetUsersQueryDto): Promise<User[]>;
  getUser(query: GetUsersQueryDto): Promise<User>;
  updateUser(id: string, dto: UpdateUserDto): Promise<User>;
  updateUserInternal(id: string, dto: InternalUpdateUserDto): Promise<User>;
}
