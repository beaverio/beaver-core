import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateConfig, PaginationType } from 'nestjs-paginate';
import { ICacheService } from 'src/common/interfaces';
import { Repository } from 'typeorm';
import { BasePaginatedRepository } from '../../../common/repositories/base-paginated.repository';
import { QueryParamsAccountDto, UpsertAccountDto } from '../dto/account.dto';
import { Account } from '../entities/account.entity';
import { IAccountsRepository } from '../interfaces/accounts-repository.interface';

@Injectable()
export class AccountsRepository
  extends BasePaginatedRepository<Account>
  implements IAccountsRepository {
  private readonly logger = new Logger(AccountsRepository.name);
  private readonly CACHE_PREFIX = 'account:';
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(
    @InjectRepository(Account)
    private readonly repo: Repository<Account>,
    @Inject('ICacheService')
    private readonly cacheService: ICacheService,
  ) {
    super(repo);
  }

  /**
   * Get default offset pagination configuration for Account entity
   * Uses offset-based pagination with flexible sorting options
   */
  protected getDefaultPaginateConfig(): PaginateConfig<Account> {
    return {
      defaultLimit: 50,
      maxLimit: 100,
      sortableColumns: ['createdAt', 'updatedAt', 'id'],
      defaultSortBy: [['createdAt', 'DESC']],
      searchableColumns: ['name'],
      filterableColumns: {
        id: true,
      },
      loadEagerRelations: false,
      paginationType: PaginationType.LIMIT_AND_OFFSET,
    };
  }

  async create(dto: UpsertAccountDto): Promise<Account> {
    const account = this.repo.create(dto);
    const savedAccount = await this.repo.save(account);
    await this.cacheEntity(savedAccount);
    this.logger.debug(`Account created and cached: ${savedAccount.id}`);
    return savedAccount;
  }

  async findOne(
    where: QueryParamsAccountDto,
  ): Promise<Account | null> {
    if (where.id) {
      const cached = await this.getCachedEntity(where.id);
      if (cached) {
        this.logger.debug(`Cache hit for account: ${where.id}`);
        return cached;
      }
    }

    const account = await this.repo.findOne({
      where,
      relations: ['memberships'],
    });

    if (account) {
      await this.cacheEntity(account);
    }

    return account;
  }

  async update(id: string, dto: UpsertAccountDto): Promise<Account> {
    await this.repo.update(id, dto);
    const account = await this.repo.findOne({
      where: { id },
      relations: ['memberships'],
    });

    if (account) {
      await this.cacheEntity(account);
    }

    return account!;
  }

  async hardDelete(id: string): Promise<void> {
    await this.invalidateEntity(id);
    await this.repo.delete(id);
  }

  async cacheEntity(entity: Account): Promise<void> {
    const key = `${this.CACHE_PREFIX}${entity.id}`;
    await this.cacheService.set(key, entity, this.CACHE_TTL);
  }

  async getCachedEntity(id: string): Promise<Account | null> {
    const key = `${this.CACHE_PREFIX}${id}`;
    return await this.cacheService.get<Account>(key);
  }

  async invalidateEntity(id: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}${id}`;
    await this.cacheService.delete(key);
  }

  async invalidateCache(entity: Account): Promise<void> {
    await this.invalidateEntity(entity.id);
  }

  getCacheKey(field: string, value: string): string {
    return `${this.CACHE_PREFIX}${field}:${value}`;
  }
}
