import {
  CreateUserDto,
  GetUsersQueryDto,
  UpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';

export interface IUserService {
  createUser(dto: CreateUserDto): Promise<User>;
  getUsers(query?: GetUsersQueryDto): Promise<User[]>;
  getUser(query: GetUsersQueryDto): Promise<User>;
  updateUser(id: string, dto: UpdateUserDto): Promise<User>;
}
