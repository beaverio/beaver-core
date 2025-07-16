import {
  CreateUserDto,
  QueryParamsUserDto,
  UpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';

export interface IUserRepository {
  create(dto: CreateUserDto): Promise<User>;
  findAll(query: QueryParamsUserDto): Promise<User[]>;
  findOne(query: QueryParamsUserDto): Promise<User | null>;
  update(id: string, dto: UpdateUserDto): Promise<User>;
}
