import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';

export interface IUserRepository {
  createUser(dto: CreateUserDto): Promise<User>;
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
}
