import { Repository, ObjectLiteral } from 'typeorm';
import {
  Paginated,
  PaginateQuery,
  PaginateConfig,
  PaginationType,
  paginate,
} from 'nestjs-paginate';
import { IPaginatedRepository } from '../interfaces/paginated-repository.interface';

/**
 * Base repository class that provides offset-based pagination functionality using nestjs-paginate
 * All entity repositories can extend this class for consistent offset pagination behavior
 */
export abstract class BasePaginatedRepository<T extends ObjectLiteral>
  implements IPaginatedRepository<T>
{
  constructor(protected readonly repository: Repository<T>) {}

  /**
   * Get the default pagination configuration for this entity
   * Subclasses should override this to define entity-specific configuration
   * Default configuration uses offset-based pagination with flexible sorting
   */
  protected abstract getDefaultPaginateConfig(): PaginateConfig<T>;

  /**
   * Find entities with offset-based pagination support
   * @param query - Pagination query parameters from nestjs-paginate
   * @param config - Optional custom pagination configuration
   * @returns Paginated result with offset metadata
   */
  async findPaginated(
    query: PaginateQuery,
    config?: PaginateConfig<T>,
  ): Promise<Paginated<T>> {
    const paginateConfig = config || this.getDefaultPaginateConfig();

    // Ensure offset-based pagination is configured
    const offsetConfig: PaginateConfig<T> = {
      ...paginateConfig,
      paginationType: PaginationType.LIMIT_AND_OFFSET,
    };

    // Ensure default limit is applied if not provided
    const paginateQuery = {
      ...query,
      limit: query.limit || offsetConfig.defaultLimit || 50,
    };

    return paginate(paginateQuery, this.repository, offsetConfig);
  }
}
