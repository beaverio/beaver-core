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

@Injectable()
export class CachedUserRepository implements IUserRepository {
  private readonly logger = new Logger(CachedUserRepository.name);
  private readonly CACHE_PREFIX = 'user:';
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @Inject('ICacheService')
    private readonly cacheService: ICacheService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = await this.repo.save(dto);

    // Cache the new user
    await this.cacheUser(user);

    this.logger.debug(`User created and cached: ${user.id}`);
    return user;
  }

  async findAll(where: QueryParamsUserDto): Promise<User[]> {
    // For findAll, we'll use database directly since caching multiple results
    // with different query parameters can be complex
    const users = await this.repo.find({ where });

    // Cache individual users for future lookups
    for (const user of users) {
      await this.cacheUser(user);
    }

    this.logger.debug(`Found ${users.length} users, cached individually`);
    return users;
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
      await this.cacheUser(user);
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
    await this.invalidateUserCache(user);

    this.repo.merge(user, dto);
    const updatedUser = await this.repo.save(user);

    // Cache the updated user
    await this.cacheUser(updatedUser);

    this.logger.debug(`User updated and re-cached: ${updatedUser.id}`);
    return updatedUser;
  }

  /**
   * Cache a user entity with multiple keys for different lookup patterns
   */
  private async cacheUser(user: User): Promise<void> {
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
  private async invalidateUserCache(user: User): Promise<void> {
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
   * Generate cache key for user lookups
   */
  private getCacheKey(field: string, value: string): string {
    return `${this.CACHE_PREFIX}${field}:${value}`;
  }
}
