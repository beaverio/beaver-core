import { Paginated, PaginateQuery } from "nestjs-paginate";
import { QueryParamsAccountDto, UpsertAccountDto } from "../dto/account.dto";
import { Account } from "../entities/account.entity";

export interface IAccountsService {
  createAccount(dto: UpsertAccountDto): Promise<Account>;
  getAccounts(query: PaginateQuery): Promise<Paginated<Account>>;
  getAccount(query: QueryParamsAccountDto): Promise<Account>;
  updateAccount(id: string, dto: UpsertAccountDto): Promise<Account>;
  deleteAccount(id: string): Promise<void>;
}