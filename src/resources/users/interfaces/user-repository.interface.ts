import { ICacheableRepository } from 'src/common/interfaces/cache-repository.interface';
import {
  ICursorPaginationOptions,
  ICursorPaginatedResult,
} from 'src/common/interfaces/cursor-pagination.interface';
import {
  CreateUserDto,
  QueryParamsUserDto,
  UpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';

export interface IUserRepository extends ICacheableRepository<User> {
  create(dto: CreateUserDto): Promise<User>;
  findAll(query: QueryParamsUserDto): Promise<User[]>;
  findAllCursor(
    options: ICursorPaginationOptions,
    where?: QueryParamsUserDto,
  ): Promise<ICursorPaginatedResult<User>>;
  findOne(query: QueryParamsUserDto): Promise<User | null>;
  update(id: string, dto: UpdateUserDto): Promise<User>;
}
