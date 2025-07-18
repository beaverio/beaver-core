import { ICacheableRepository } from 'src/common/interfaces/cache-repository.interface';
import { IPaginatedRepository } from 'src/common/interfaces/paginated-repository.interface';
import {
  CreateUserDto,
  QueryParamsUserDto,
  UpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';

export interface IUserRepository
  extends ICacheableRepository<User>,
    IPaginatedRepository<User> {
  create(dto: CreateUserDto): Promise<User>;
  findAll(query: QueryParamsUserDto): Promise<User[]>;
  findOne(query: QueryParamsUserDto): Promise<User | null>;
  update(id: string, dto: UpdateUserDto): Promise<User>;
}
