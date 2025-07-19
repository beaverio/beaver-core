import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateConfig, PaginationType } from 'nestjs-paginate';
import { ICacheService } from 'src/common/interfaces';
import { Repository } from 'typeorm';
import { BasePaginatedRepository } from '../../../common/repositories/base-paginated.repository';
import { QueryParamsFamilyDto, UpsertFamilyDto } from '../dto/family.dto';
import { Family } from '../entities/family.entity';
import { IFamiliesRepository } from '../interfaces/families-repository.interface';

@Injectable()
export class FamiliesRepository
  extends BasePaginatedRepository<Family>
  implements IFamiliesRepository
{
  private readonly logger = new Logger(FamiliesRepository.name);
  private readonly CACHE_PREFIX = 'family:';
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(
    @InjectRepository(Family)
    private readonly repo: Repository<Family>,
    @Inject('ICacheService')
    private readonly cacheService: ICacheService,
  ) {
    super(repo);
  }

  /**
   * Get default offset pagination configuration for Family entity
   * Uses offset-based pagination with flexible sorting options
   */
  protected getDefaultPaginateConfig(): PaginateConfig<Family> {
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

  async create(dto: UpsertFamilyDto): Promise<Family> {
    const family = this.repo.create(dto);
    const savedFamily = await this.repo.save(family);
    await this.cacheEntity(savedFamily);
    this.logger.debug(`Family created and cached: ${savedFamily.id}`);
    return savedFamily;
  }

  async findOne(where: QueryParamsFamilyDto): Promise<Family | null> {
    if (where.id) {
      const cached = await this.getCachedEntity(where.id);
      if (cached) {
        this.logger.debug(`Cache hit for family: ${where.id}`);
        return cached;
      }
    }

    const family = await this.repo.findOne({
      where,
      relations: ['memberships'],
    });

    if (family) {
      await this.cacheEntity(family);
    }

    return family;
  }

  async update(id: string, dto: UpsertFamilyDto): Promise<Family> {
    await this.repo.update(id, dto);
    const family = await this.repo.findOne({
      where: { id },
      relations: ['memberships'],
    });

    if (family) {
      await this.cacheEntity(family);
    }

    return family!;
  }

  async hardDelete(id: string): Promise<void> {
    await this.invalidateEntity(id);
    await this.repo.delete(id);
  }

  async cacheEntity(entity: Family): Promise<void> {
    const key = `${this.CACHE_PREFIX}${entity.id}`;
    await this.cacheService.set(key, entity, this.CACHE_TTL);
  }

  async getCachedEntity(id: string): Promise<Family | null> {
    const key = `${this.CACHE_PREFIX}${id}`;
    return await this.cacheService.get<Family>(key);
  }

  async invalidateEntity(id: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}${id}`;
    await this.cacheService.delete(key);
  }

  async invalidateCache(entity: Family): Promise<void> {
    await this.invalidateEntity(entity.id);
  }

  getCacheKey(field: string, value: string): string {
    return `${this.CACHE_PREFIX}${field}:${value}`;
  }

  getEntityCacheKey(id: string): string {
    return `${this.CACHE_PREFIX}${id}`;
  }
}
