export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface IPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface IPaginatedRepository<T> {
  findAllPaginated(
    options: IPaginationOptions,
    where?: any,
  ): Promise<IPaginatedResult<T>>;
}
