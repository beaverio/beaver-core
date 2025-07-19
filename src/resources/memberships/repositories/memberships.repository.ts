import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateConfig, PaginationType } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { ICacheService } from '../../../common/interfaces/cache-service.interface';
import { BasePaginatedRepository } from '../../../common/repositories/base-paginated.repository';
import { IFamiliesRepository } from '../../families/interfaces/families-repository.interface';
import { IUsersRepository } from '../../users/interfaces/users-repository.interface';
import {
  CreateMembershipDto,
  QueryParamsMembershipDto,
  UpdateMembershipDto,
} from '../dto/membership.dto';
import { Membership } from '../entities/membership.entity';
import { IMembershipsRepository } from '../interfaces/memberships-repository.interface';

@Injectable()
export class MembershipsRepository
  extends BasePaginatedRepository<Membership>
  implements IMembershipsRepository
{
  private readonly logger = new Logger(MembershipsRepository.name);
  private readonly CACHE_PREFIX = 'membership:';
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(
    @InjectRepository(Membership)
    private readonly repo: Repository<Membership>,
    @Inject('ICacheService')
    private readonly cacheService: ICacheService,
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
    @Inject('IFamiliesRepository')
    private readonly familiesRepository: IFamiliesRepository,
  ) {
    super(repo);
  }

  /**
   * Get default offset pagination configuration for Membership entity
   */
  protected getDefaultPaginateConfig(): PaginateConfig<Membership> {
    return {
      defaultLimit: 50,
      maxLimit: 100,
      sortableColumns: ['createdAt', 'updatedAt', 'id'],
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        userId: true,
        familyId: true,
        id: true,
      },
      loadEagerRelations: false,
      paginationType: PaginationType.LIMIT_AND_OFFSET,
      relations: ['user', 'family'],
    };
  }

  async create(dto: CreateMembershipDto): Promise<Membership> {
    const membership = this.repo.create(dto);
    const savedMembership = await this.repo.save(membership);
    await this.cacheEntity(savedMembership);
    await this.invalidateUserMembershipsCache(dto.userId);
    await this.invalidateFamilyMembershipsCache(dto.familyId);
    // Invalidate user and family entity caches since their memberships relationship changed
    await this.invalidateUserEntityCache(dto.userId);
    await this.invalidateFamilyEntityCache(dto.familyId);
    this.logger.debug(`Membership created and cached: ${savedMembership.id}`);
    return savedMembership;
  }

  async findOne(where: QueryParamsMembershipDto): Promise<Membership | null> {
    if (where.id) {
      const cached = await this.getCachedEntity(where.id);
      if (cached) {
        this.logger.debug(`Cache hit for membership: ${where.id}`);
        return cached;
      }
    }

    const membership = await this.repo.findOne({
      where,
      relations: ['user', 'family'],
    });

    if (membership) {
      await this.cacheEntity(membership);
    }

    return membership;
  }

  async update(id: string, dto: UpdateMembershipDto): Promise<Membership> {
    await this.repo.update(id, dto);
    const membership = await this.repo.findOne({
      where: { id },
      relations: ['user', 'family'],
    });

    if (membership) {
      await this.cacheEntity(membership);
      await this.invalidateUserMembershipsCache(membership.userId);
      await this.invalidateFamilyMembershipsCache(membership.familyId);
      // Invalidate user and family entity caches since their memberships relationship changed
      await this.invalidateUserEntityCache(membership.userId);
      await this.invalidateFamilyEntityCache(membership.familyId);
    }

    return membership!;
  }

  async hardDelete(id: string): Promise<void> {
    const membership = await this.repo.findOneBy({ id });
    if (membership) {
      await this.invalidateEntity(id);
      await this.invalidateUserMembershipsCache(membership.userId);
      await this.invalidateFamilyMembershipsCache(membership.familyId);
      // Invalidate user and family entity caches since their memberships relationship changed
      await this.invalidateUserEntityCache(membership.userId);
      await this.invalidateFamilyEntityCache(membership.familyId);
    }
    await this.repo.delete(id);
  }

  async findByUserId(userId: string): Promise<Membership[]> {
    const cacheKey = `${this.CACHE_PREFIX}user:${userId}:memberships`;
    const cached = await this.cacheService.get<Membership[]>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for user memberships: ${userId}`);
      return cached;
    }

    const memberships = await this.repo.find({
      where: { userId },
      relations: ['family'],
    });

    await this.cacheService.set(cacheKey, memberships, this.CACHE_TTL);
    return memberships;
  }

  async findByFamilyId(familyId: string): Promise<Membership[]> {
    const cacheKey = `${this.CACHE_PREFIX}family:${familyId}:memberships`;
    const cached = await this.cacheService.get<Membership[]>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for family memberships: ${familyId}`);
      return cached;
    }

    const memberships = await this.repo.find({
      where: { familyId },
      relations: ['user'],
    });

    await this.cacheService.set(cacheKey, memberships, this.CACHE_TTL);
    return memberships;
  }

  async findByUserAndFamily(
    userId: string,
    familyId: string,
  ): Promise<Membership | null> {
    return await this.repo.findOne({
      where: { userId, familyId },
      relations: ['user', 'family'],
    });
  }

  async cacheEntity(entity: Membership): Promise<void> {
    const key = `${this.CACHE_PREFIX}${entity.id}`;
    await this.cacheService.set(key, entity, this.CACHE_TTL);
  }

  async getCachedEntity(id: string): Promise<Membership | null> {
    const key = `${this.CACHE_PREFIX}${id}`;
    return await this.cacheService.get<Membership>(key);
  }

  async invalidateEntity(id: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}${id}`;
    await this.cacheService.delete(key);
  }

  async invalidateCache(entity: Membership): Promise<void> {
    await this.invalidateEntity(entity.id);
    await this.invalidateUserMembershipsCache(entity.userId);
    await this.invalidateFamilyMembershipsCache(entity.familyId);
    // Invalidate user and family entity caches since their memberships relationship changed
    await this.invalidateUserEntityCache(entity.userId);
    await this.invalidateFamilyEntityCache(entity.familyId);
  }

  private async invalidateUserMembershipsCache(userId: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}user:${userId}:memberships`;
    await this.cacheService.delete(key);
  }

  private async invalidateFamilyMembershipsCache(
    familyId: string,
  ): Promise<void> {
    const key = `${this.CACHE_PREFIX}family:${familyId}:memberships`;
    await this.cacheService.delete(key);
  }

  private async invalidateUserEntityCache(userId: string): Promise<void> {
    const userCacheKey = this.usersRepository.getEntityCacheKey(userId);
    await this.cacheService.delete(userCacheKey);
  }

  private async invalidateFamilyEntityCache(familyId: string): Promise<void> {
    const familyCacheKey = this.familiesRepository.getEntityCacheKey(familyId);
    await this.cacheService.delete(familyCacheKey);
  }

  getCacheKey(field: string, value: string): string {
    return `${this.CACHE_PREFIX}${field}:${value}`;
  }

  getEntityCacheKey(id: string): string {
    return `${this.CACHE_PREFIX}${id}`;
  }
}
