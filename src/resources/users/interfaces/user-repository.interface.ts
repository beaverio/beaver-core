import { ICacheableRepository } from 'src/common/interfaces/cache-repository.interface';
import { PaginateQuery, Paginated } from 'nestjs-paginate';
import {
  CreateUserDto,
  QueryParamsUserDto,
  UpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';

export interface IUserRepository extends ICacheableRepository<User> {
  create(dto: CreateUserDto): Promise<User>;
  findAll(query: QueryParamsUserDto): Promise<User[]>;
  findAllPaginated(query: PaginateQuery): Promise<Paginated<User>>;
  findOne(query: QueryParamsUserDto): Promise<User | null>;
  update(id: string, dto: UpdateUserDto): Promise<User>;
}
