import { CreateUserDto, GetUsersQueryDto, UpdateUserDto } from '../dto/user.dto';
import { User } from '../entities/user.entity';

export interface IUserRepository {
  create(dto: CreateUserDto): Promise<User>;
  findAll(query: GetUsersQueryDto): Promise<User[]>
  findOne(query: GetUsersQueryDto): Promise<User | null>;
  update(id: string, dto: UpdateUserDto): Promise<User>;
}
