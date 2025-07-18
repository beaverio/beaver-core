import { Paginated, PaginateQuery, PaginateConfig } from 'nestjs-paginate';
import { ObjectLiteral } from 'typeorm';

/**
 * Generic interface for repositories that support pagination using nestjs-paginate
 */
export interface IPaginatedRepository<T extends ObjectLiteral> {
  /**
   * Find entities with pagination support
   * @param query - Pagination query parameters from nestjs-paginate
   * @param config - Pagination configuration for the entity
   * @returns Paginated result
   */
  findPaginated(
    query: PaginateQuery,
    config?: PaginateConfig<T>,
  ): Promise<Paginated<T>>;
}
