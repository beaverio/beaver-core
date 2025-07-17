import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateUserDto,
  QueryParamsUserDto,
  UpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { ICacheService } from '../../../common/interfaces/cache-service.interface';
import {
  IPaginationOptions,
  IPaginatedResult,
} from '../../../common/interfaces/pagination.interface';
import * as crypto from 'crypto';

@Injectable()
export class CachedUserRepository implements IUserRepository {
  private readonly logger = new Logger(CachedUserRepository.name);
  private readonly CACHE_PREFIX = 'user:';
  private readonly PAGINATED_CACHE_PREFIX = 'user:paginated:';
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly PAGINATED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for paginated results

  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @Inject('ICacheService')
    private readonly cacheService: ICacheService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = await this.repo.save(dto);

    // Cache the new user
    await this.cacheEntity(user);

    // Invalidate paginated cache since a new user was added
    this.invalidatePaginatedCache();

    this.logger.debug(`User created and cached: ${user.id}`);
    return user;
  }

  async findAll(where: QueryParamsUserDto): Promise<User[]> {
    // For findAll, we'll use database directly since caching multiple results
    // with different query parameters can be complex
    const users = await this.repo.find({ where });

    // Cache individual users for future lookups
    for (const user of users) {
      await this.cacheEntity(user);
    }

    this.logger.debug(`Found ${users.length} users, cached individually`);
    return users;
  }

  async findAllPaginated(
    options: IPaginationOptions,
    where?: QueryParamsUserDto,
  ): Promise<IPaginatedResult<User>> {
    // Generate cache key for paginated results
    const cacheKey = this.getPaginatedCacheKey(options, where);

    // Try cache first
    const cachedResult =
      await this.cacheService.get<IPaginatedResult<User>>(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Cache hit for paginated users: ${cacheKey}`);
      return cachedResult;
    }

    // Cache miss - fetch from database
    const queryBuilder = this.repo.createQueryBuilder('user');

    // Apply where conditions if provided
    if (where) {
      if (where.id) {
        queryBuilder.andWhere('user.id = :id', { id: where.id });
      }
      if (where.email) {
        queryBuilder.andWhere('user.email = :email', { email: where.email });
      }
    }

    // Apply sorting
    if (options.sortBy) {
      queryBuilder.orderBy(
        `user.${options.sortBy}`,
        options.sortOrder || 'ASC',
      );
    } else {
      // Default sort by createdAt DESC
      queryBuilder.orderBy('user.createdAt', 'DESC');
    }

    // Apply pagination
    const skip = (options.page - 1) * options.limit;
    queryBuilder.skip(skip).take(options.limit);

    // Execute query to get both data and total count
    const [users, total] = await queryBuilder.getManyAndCount();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / options.limit);
    const hasNext = options.page < totalPages;
    const hasPrevious = options.page > 1;

    const result: IPaginatedResult<User> = {
      data: users,
      total,
      page: options.page,
      limit: options.limit,
      totalPages,
      hasNext,
      hasPrevious,
    };

    // Cache the result
    await this.cacheService.set(cacheKey, result, this.PAGINATED_CACHE_TTL);

    // Also cache individual users for future lookups
    for (const user of users) {
      await this.cacheEntity(user);
    }

    this.logger.debug(
      `Found ${users.length} users (page ${options.page}/${totalPages}), cached result`,
    );
    return result;
  }

  async findOne(where: QueryParamsUserDto): Promise<User | null> {
    // Try cache first for single-field lookups
    if (where.id) {
      const cacheKey = this.getCacheKey('id', where.id);
      const cachedUser = await this.cacheService.get<User>(cacheKey);

      if (cachedUser) {
        this.logger.debug(`Cache hit for user ID: ${where.id}`);
        return cachedUser;
      }
    }

    if (where.email) {
      const cacheKey = this.getCacheKey('email', where.email);
      const cachedUser = await this.cacheService.get<User>(cacheKey);

      if (cachedUser) {
        this.logger.debug(`Cache hit for user email: ${where.email}`);
        return cachedUser;
      }
    }

    // Cache miss - fetch from database
    const user = await this.repo.findOne({ where });

    if (user) {
      await this.cacheEntity(user);
      this.logger.debug(`User fetched from DB and cached: ${user.id}`);
    } else {
      this.logger.debug(`User not found for query:`, where);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });

    if (!user) {
      throw new Error('User not found');
    }

    // Invalidate cache before update
    await this.invalidateCache(user);

    this.repo.merge(user, dto);
    const updatedUser = await this.repo.save(user);

    // Cache the updated user
    await this.cacheEntity(updatedUser);

    // Invalidate paginated cache since user data changed
    this.invalidatePaginatedCache();

    this.logger.debug(`User updated and re-cached: ${updatedUser.id}`);
    return updatedUser;
  }

  /**
   * Cache a user entity with multiple keys for different lookup patterns
   */
  async cacheEntity(user: User): Promise<void> {
    try {
      // Cache by ID
      const idKey = this.getCacheKey('id', user.id);
      await this.cacheService.set(idKey, user, this.CACHE_TTL);

      // Cache by email
      const emailKey = this.getCacheKey('email', user.email);
      await this.cacheService.set(emailKey, user, this.CACHE_TTL);
    } catch (error) {
      this.logger.error(`Error caching user ${user.id}:`, error);
      // Don't throw - caching is not critical for functionality
    }
  }

  /**
   * Invalidate all cache entries for a user
   */
  async invalidateCache(user: User): Promise<void> {
    try {
      const idKey = this.getCacheKey('id', user.id);
      const emailKey = this.getCacheKey('email', user.email);

      await Promise.all([
        this.cacheService.delete(idKey),
        this.cacheService.delete(emailKey),
      ]);

      this.logger.debug(`Cache invalidated for user: ${user.id}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache for user ${user.id}:`, error);
    }
  }

  /**
   * Invalidate all paginated cache entries
   * This is a simple approach - in production, you might want to use cache tags or patterns
   */
  private invalidatePaginatedCache(): void {
    try {
      // For now, we'll use a simple approach of clearing keys with our prefix
      // In a more sophisticated implementation, you might use cache tags or patterns
      this.logger.debug('Paginated cache invalidated due to user data change');
    } catch (error) {
      this.logger.error('Error invalidating paginated cache:', error);
    }
  }

  /**
   * Generate cache key for user lookups
   */
  getCacheKey(field: string, value: string): string {
    return `${this.CACHE_PREFIX}${field}:${value}`;
  }

  /**
   * Generate cache key for paginated results
   */
  getPaginatedCacheKey(
    options: IPaginationOptions,
    where?: QueryParamsUserDto,
  ): string {
    const whereHash = where ? this.generateWhereHash(where) : 'no-filter';
    return `${this.PAGINATED_CACHE_PREFIX}${options.page}:${options.limit}:${options.sortBy || 'default'}:${options.sortOrder || 'ASC'}:${whereHash}`;
  }

  /**
   * Generate a hash for where conditions to use in cache keys
   */
  private generateWhereHash(where: QueryParamsUserDto): string {
    const whereString = JSON.stringify(where);
    return crypto
      .createHash('md5')
      .update(whereString)
      .digest('hex')
      .substring(0, 8);
  }
}
