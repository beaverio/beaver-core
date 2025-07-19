import { ICacheableRepository } from 'src/common/interfaces/cache-repository.interface';
import { IPaginatedRepository } from 'src/common/interfaces/paginated-repository.interface';
import { QueryParamsAccountDto, UpsertAccountDto } from '../dto/account.dto';
import { Account } from '../entities/account.entity';

export interface IAccountsRepository
  extends ICacheableRepository<Account>,
  IPaginatedRepository<Account> {
  create(dto: UpsertAccountDto): Promise<Account>;
  findAll(query: QueryParamsAccountDto): Promise<Account[]>;
  findOne(query: QueryParamsAccountDto): Promise<Account | null>;
  update(id: string, dto: UpsertAccountDto): Promise<Account>;
  hardDelete(id: string): Promise<void>;
}
