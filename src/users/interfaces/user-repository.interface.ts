import { CreateUserDto } from '../dto/create-user.dto';
import { GetUsersQueryDto } from '../dto/query-params-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

export interface IUserRepository {
  create(dto: CreateUserDto): Promise<User>;
  findAll(query: GetUsersQueryDto): Promise<User[]>
  findOne(query: GetUsersQueryDto): Promise<User | null>;
  update(id: string, dto: UpdateUserDto): Promise<User>;
}
