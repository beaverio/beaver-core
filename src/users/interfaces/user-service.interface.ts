import { CreateUserDto } from '../dto/create-user.dto';
import { GetUsersQueryDto } from '../dto/query-params-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

export interface IUserService {
  createUser(dto: CreateUserDto): Promise<User>;
  getUsers(query?: GetUsersQueryDto): Promise<User[]>
  getUser(query: GetUsersQueryDto): Promise<User>;
  updateUser(id: string, dto: UpdateUserDto): Promise<User>;
}
