export interface ICursorPaginationOptions {
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ICursorPaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  prevCursor?: string;
  hasNext: boolean;
  hasPrevious: boolean;
  total?: number;
}

export interface ICursorPaginatedRepository<T> {
  findAllCursor(
    options: ICursorPaginationOptions,
    where?: any,
  ): Promise<ICursorPaginatedResult<T>>;
}
