import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

export interface IUserService {
  createUser(dto: CreateUserDto): Promise<User>;
  getUsers(): Promise<User[]>
  getUser(query: Partial<User>): Promise<User>;
  updateUser(id: string, dto: UpdateUserDto): Promise<User>;
}
