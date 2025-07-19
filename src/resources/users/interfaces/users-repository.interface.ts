import { ICacheableRepository } from 'src/common/interfaces/cache-repository.interface';
import { IPaginatedRepository } from 'src/common/interfaces/paginated-repository.interface';
import {
  CreateUserDto,
  QueryParamsUserDto,
  UpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';

export interface IUsersRepository
  extends ICacheableRepository<User>,
  IPaginatedRepository<User> {
  create(dto: CreateUserDto): Promise<User>;
  findOne(query: QueryParamsUserDto): Promise<User | null>;
  update(id: string, dto: UpdateUserDto): Promise<User>;
  hardDelete(id: string): Promise<void>;
  updateLastLogin(id: string): Promise<User>;
}
