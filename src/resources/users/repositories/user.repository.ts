import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginateConfig, PaginationType } from 'nestjs-paginate';
import { BasePaginatedRepository } from '../../../common/repositories/base-paginated.repository';
import {
  CreateUserDto,
  QueryParamsUserDto,
  UpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { ICacheService } from '../../../common/interfaces/cache-service.interface';

@Injectable()
export class UserRepository
  extends BasePaginatedRepository<User>
  implements IUserRepository
{
  private readonly logger = new Logger(UserRepository.name);
  private readonly CACHE_PREFIX = 'user:';
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @Inject('ICacheService')
    private readonly cacheService: ICacheService,
  ) {
    super(repo);
  }

  /**
   * Get default cursor pagination configuration for User entity
   * Uses Unix timestamp (integer) based cursor pagination with createdAt
   */
  protected getDefaultPaginateConfig(): PaginateConfig<User> {
    return {
      defaultLimit: 50,
      maxLimit: 100,
      sortableColumns: ['createdAt', 'updatedAt', 'id'],
      defaultSortBy: [['createdAt', 'DESC']],
      searchableColumns: ['email'],
      filterableColumns: {
        email: true,
        id: true,
      },
      loadEagerRelations: false,
      paginationType: PaginationType.CURSOR,
    };
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.repo.create(dto);
    const savedUser = await this.repo.save(user);
    await this.cacheEntity(savedUser);
    this.logger.debug(`User created and cached: ${savedUser.id}`);
    return savedUser;
  }

  async findAll(where: QueryParamsUserDto): Promise<User[]> {
    const queryBuilder = this.repo.createQueryBuilder('user');

    if (where.email) {
      queryBuilder.andWhere('user.email = :email', { email: where.email });
    }

    if (where.id) {
      queryBuilder.andWhere('user.id = :id', { id: where.id });
    }

    return await queryBuilder.getMany();
  }

  async findOne(where: QueryParamsUserDto): Promise<User | null> {
    // Try cache first
    if (where.id) {
      const cached = await this.getCachedEntity(where.id);
      if (cached) {
        this.logger.debug(`Cache hit for user: ${where.id}`);
        return cached;
      }
    }

    const user = await this.repo.findOne({
      where: where as Parameters<typeof this.repo.findOne>[0]['where'],
    });

    if (user) {
      await this.cacheEntity(user);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.repo.update(id, dto);
    const user = await this.repo.findOneBy({ id });

    if (user) {
      await this.cacheEntity(user);
    }

    return user!;
  }

  async cacheEntity(entity: User): Promise<void> {
    const key = `${this.CACHE_PREFIX}${entity.id}`;
    await this.cacheService.set(key, entity, this.CACHE_TTL);
  }

  async getCachedEntity(id: string): Promise<User | null> {
    const key = `${this.CACHE_PREFIX}${id}`;
    return await this.cacheService.get<User>(key);
  }

  async invalidateEntity(id: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}${id}`;
    await this.cacheService.delete(key);
  }

  async invalidateCache(entity: User): Promise<void> {
    await this.invalidateEntity(entity.id);
  }

  getCacheKey(field: string, value: string): string {
    return `${this.CACHE_PREFIX}${field}:${value}`;
  }
}
