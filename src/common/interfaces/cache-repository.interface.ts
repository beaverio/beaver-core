export interface ICacheableRepository<T> {
  cacheEntity(entity: T): Promise<void>;
  invalidateCache(entity: T): Promise<void>;
  getCacheKey(field: string, value: string): string;
}
