import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IAccountsService } from '../interfaces/accounts-service.interface';
import { IAccountsRepository } from '../interfaces/accounts-repository.interface';
import { PaginateQuery, Paginated } from 'nestjs-paginate';
import { UpsertAccountDto, QueryParamsAccountDto } from '../dto/account.dto';
import { Account } from '../entities/account.entity';

@Injectable()
export class AccountsService implements IAccountsService {
  constructor(
    @Inject('IAccountsRepository')
    private readonly accountsRepository: IAccountsRepository,
  ) {}

  async createAccount(dto: UpsertAccountDto): Promise<Account> {
    return this.accountsRepository.create(dto);
  }

  async getAccounts(query: PaginateQuery): Promise<Paginated<Account>> {
    return this.accountsRepository.findPaginated(query);
  }

  async getAccount(query: QueryParamsAccountDto): Promise<Account> {
    const account = await this.accountsRepository.findOne(query);

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async updateAccount(id: string, dto: UpsertAccountDto): Promise<Account> {
    return await this.accountsRepository.update(id, dto);
  }

  async deleteAccount(id: string): Promise<void> {
    // Check if account exists before deleting (without loading relations)
    const account = await this.accountsRepository.findOne({ id });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return this.accountsRepository.hardDelete(id);
  }
}
