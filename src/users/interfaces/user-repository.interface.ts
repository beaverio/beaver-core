import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

export interface IUserRepository {
  create(dto: CreateUserDto): Promise<User>;
  findAll(): Promise<User[]>
  findOne(where: Partial<User>): Promise<User | null>;
  update(id: string, dto: UpdateUserDto): Promise<User>;
}
