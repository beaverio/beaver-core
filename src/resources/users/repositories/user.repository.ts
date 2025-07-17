import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  CreateUserDto,
  QueryParamsUserDto,
  UpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { ICacheService } from '../../../common/interfaces/cache-service.interface';
import {
  ICursorPaginationOptions,
  ICursorPaginatedResult,
} from '../../../common/interfaces/cursor-pagination.interface';
import * as crypto from 'crypto';

@Injectable()
export class UserRepository implements IUserRepository {
  private readonly logger = new Logger(UserRepository.name);
  private readonly CACHE_PREFIX = 'user:';
  private readonly CURSOR_CACHE_PREFIX = 'user:cursor:';
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly CURSOR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for cursor results

  private readonly DEFAULT_LIMIT = 10;
  private readonly MAX_LIMIT = 100;
  private readonly SORTABLE_COLUMNS = ['id', 'email', 'createdAt', 'updatedAt'];

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

    // Invalidate cursor cache since a new user was added
    this.invalidateCursorCache();

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

  async findAllCursor(
    options: ICursorPaginationOptions,
    where?: QueryParamsUserDto,
  ): Promise<ICursorPaginatedResult<User>> {
    // Generate cache key for cursor results
    const cacheKey = this.getCursorCacheKey(options, where);

    // Try cache first
    const cachedResult =
      await this.cacheService.get<ICursorPaginatedResult<User>>(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Cache hit for cursor pagination: ${cacheKey}`);
      return cachedResult;
    }

    // Validate options
    const limit = Math.min(options.limit || this.DEFAULT_LIMIT, this.MAX_LIMIT);
    const sortBy = this.SORTABLE_COLUMNS.includes(options.sortBy || 'createdAt')
      ? options.sortBy || 'createdAt'
      : 'createdAt';
    const sortOrder = options.sortOrder || 'DESC';

    // Build query
    const queryBuilder = this.buildCursorQuery(where, sortBy, sortOrder);

    // Apply cursor-based filtering
    if (options.cursor) {
      const decodedCursor = this.decodeCursor(options.cursor);
      if (decodedCursor) {
        if (sortOrder === 'DESC') {
          queryBuilder.andWhere(`user.${sortBy} < :cursorValue`, {
            cursorValue: decodedCursor.value,
          });
        } else {
          queryBuilder.andWhere(`user.${sortBy} > :cursorValue`, {
            cursorValue: decodedCursor.value,
          });
        }
      }
    }

    // Fetch one extra record to check if there's a next page
    queryBuilder.limit(limit + 1);

    const users = await queryBuilder.getMany();

    // Determine if there's a next page
    const hasNext = users.length > limit;
    if (hasNext) {
      users.pop(); // Remove the extra record
    }

    // Determine cursors
    let nextCursor: string | undefined;
    let prevCursor: string | undefined;

    if (users.length > 0) {
      // Next cursor from the last item
      if (hasNext) {
        const lastUser = users[users.length - 1];
        nextCursor = this.encodeCursor(lastUser[sortBy as keyof User]);
      }

      // Previous cursor from the first item (we need to check if there are items before this)
      const firstUser = users[0];
      const hasPrevious = await this.checkHasPrevious(
        firstUser,
        sortBy,
        sortOrder,
        where,
      );
      if (hasPrevious) {
        prevCursor = this.encodeCursor(firstUser[sortBy as keyof User]);
      }
    }

    const result: ICursorPaginatedResult<User> = {
      data: users,
      nextCursor,
      prevCursor,
      hasNext,
      hasPrevious: !!prevCursor,
    };

    // Cache the result
    await this.cacheService.set(cacheKey, result, this.CURSOR_CACHE_TTL);

    // Cache individual users for future lookups
    for (const user of users) {
      await this.cacheEntity(user);
    }

    this.logger.debug(
      `Found ${users.length} users using cursor pagination (limit: ${limit}, sortBy: ${sortBy}), cached result`,
    );
    return result;
  }

  private buildCursorQuery(
    where?: QueryParamsUserDto,
    sortBy = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): SelectQueryBuilder<User> {
    const queryBuilder = this.repo
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.createdAt', 'user.updatedAt']); // Exclude password

    // Apply where conditions
    if (where?.id) {
      queryBuilder.andWhere('user.id = :id', { id: where.id });
    }
    if (where?.email) {
      queryBuilder.andWhere('user.email = :email', { email: where.email });
    }

    // Apply sorting
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    return queryBuilder;
  }

  private async checkHasPrevious(
    firstUser: User,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
    where?: QueryParamsUserDto,
  ): Promise<boolean> {
    const queryBuilder = this.buildCursorQuery(where, sortBy, sortOrder);

    if (sortOrder === 'DESC') {
      queryBuilder.andWhere(`user.${sortBy} > :value`, {
        value: firstUser[sortBy as keyof User],
      });
    } else {
      queryBuilder.andWhere(`user.${sortBy} < :value`, {
        value: firstUser[sortBy as keyof User],
      });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  private encodeCursor(value: string | Date): string {
    const cursorValue = value instanceof Date ? value.toISOString() : value;
    return Buffer.from(cursorValue).toString('base64');
  }

  private decodeCursor(cursor: string): { value: string } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      return { value: decoded };
    } catch {
      return null;
    }
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

    // Invalidate cursor cache since user data changed
    this.invalidateCursorCache();

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
   * Invalidate all cursor cache entries
   * This is a simple approach - in production, you might want to use cache tags or patterns
   */
  private invalidateCursorCache(): void {
    try {
      // For now, we'll use a simple approach of clearing keys with our prefix
      // In a more sophisticated implementation, you might use cache tags or patterns
      this.logger.debug('Cursor cache invalidated due to user data change');
    } catch (error) {
      this.logger.error('Error invalidating cursor cache:', error);
    }
  }

  /**
   * Generate cache key for user lookups
   */
  getCacheKey(field: string, value: string): string {
    return `${this.CACHE_PREFIX}${field}:${value}`;
  }

  /**
   * Generate cache key for cursor results
   */
  getCursorCacheKey(
    options: ICursorPaginationOptions,
    where?: QueryParamsUserDto,
  ): string {
    const queryHash = this.generateCursorQueryHash(options, where);
    return `${this.CURSOR_CACHE_PREFIX}${queryHash}`;
  }

  /**
   * Generate a hash for cursor query to use in cache keys
   */
  private generateCursorQueryHash(
    options: ICursorPaginationOptions,
    where?: QueryParamsUserDto,
  ): string {
    const queryString = JSON.stringify({
      limit: options.limit,
      cursor: options.cursor,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      where: where,
    });
    return crypto
      .createHash('md5')
      .update(queryString)
      .digest('hex')
      .substring(0, 8);
  }
}
