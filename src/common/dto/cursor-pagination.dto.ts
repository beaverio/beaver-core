import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CursorPaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  @Transform(({ value }): 'ASC' | 'DESC' | undefined => {
    if (typeof value === 'string') {
      const upper = value.toUpperCase();
      return upper === 'ASC' || upper === 'DESC' ? upper : undefined;
    }
    return value;
  })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class CursorPaginatedResponseDto<T> {
  data: T[];
  nextCursor?: string;
  prevCursor?: string;
  hasNext: boolean;
  hasPrevious: boolean;
  total?: number;

  constructor(
    data: T[],
    nextCursor?: string,
    prevCursor?: string,
    hasNext = false,
    hasPrevious = false,
    total?: number,
  ) {
    this.data = data;
    this.nextCursor = nextCursor;
    this.prevCursor = prevCursor;
    this.hasNext = hasNext;
    this.hasPrevious = hasPrevious;
    this.total = total;
  }

  static fromResult<T>(result: {
    data: T[];
    nextCursor?: string;
    prevCursor?: string;
    hasNext: boolean;
    hasPrevious: boolean;
    total?: number;
  }): CursorPaginatedResponseDto<T> {
    return new CursorPaginatedResponseDto(
      result.data,
      result.nextCursor,
      result.prevCursor,
      result.hasNext,
      result.hasPrevious,
      result.total,
    );
  }
}
