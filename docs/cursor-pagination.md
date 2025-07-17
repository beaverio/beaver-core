# Cursor-Based Pagination Implementation

This document explains the custom cursor-based pagination implementation that replaces the previous `nestjs-paginate` library approach.

## Overview

Cursor-based pagination provides better performance and consistency for large datasets compared to offset-based pagination. It's particularly beneficial for high-volume entities like transactions where new records are frequently inserted.

## Key Benefits

1. **Consistent Performance**: Query time remains constant regardless of dataset size
2. **Real-time Consistency**: No "shifting results" when new records are added during pagination
3. **Better Scalability**: Avoids the "deep offset" problem of traditional pagination
4. **Previous Cursor Support**: Enables bidirectional navigation

## API Usage

### Basic Cursor Pagination

```http
GET /users?limit=10
GET /users?limit=10&cursor=eyJjcmVhdGVkQXQiOiIyMDIzLTEyLTMxVDIzOjU5OjU5LjAwMFoifQ==
```

### With Filtering and Sorting

```http
GET /users?limit=5&sortBy=email&sortOrder=ASC&email=test@example.com
GET /users?limit=20&sortBy=createdAt&sortOrder=DESC&cursor=prev_cursor_value
```

### Explicit Cursor Endpoint

```http
GET /users/cursor?limit=10&cursor=next_cursor_value
```

## Response Format

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2025-01-17T20:24:53.000Z",
      "updatedAt": "2025-01-17T20:24:53.000Z"
    }
  ],
  "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI1LTAxLTE3VDIwOjI0OjUzLjAwMFoifQ==",
  "prevCursor": "eyJjcmVhdGVkQXQiOiIyMDI1LTAxLTE3VDIwOjI0OjUyLjAwMFoifQ==",
  "hasNext": true,
  "hasPrevious": true
}
```

## Implementation Details

### Core Interfaces

- **`ICursorPaginationOptions`**: Pagination parameters
- **`ICursorPaginatedResult<T>`**: Response format with cursors
- **`ICursorPaginatedRepository<T>`**: Repository interface extension

### Cursor Encoding

Cursors are base64-encoded values of the sort field (typically timestamps or IDs):

```typescript
// Encode
const cursor = Buffer.from('2025-01-17T20:24:53.000Z').toString('base64');

// Decode
const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
```

### Query Building

The implementation uses TypeORM QueryBuilder for efficient queries:

```typescript
const queryBuilder = this.repo
  .createQueryBuilder('user')
  .select(['user.id', 'user.email', 'user.createdAt', 'user.updatedAt'])
  .orderBy('user.createdAt', 'DESC');

// Apply cursor filter
if (cursor) {
  queryBuilder.andWhere('user.createdAt < :cursorValue', { cursorValue: decodedCursor });
}
```

### Bidirectional Navigation

- **Next Cursor**: Created from the last item in the current page
- **Previous Cursor**: Created from the first item, with existence check via additional query

### Caching Strategy

- **Result Caching**: Paginated results cached for 5 minutes with hash-based keys
- **Individual Entity Caching**: Users from paginated results cached for future lookups
- **Cache Invalidation**: Automatic clearing when data changes

## Validation

Query parameters are validated using class-validator:

```typescript
class CursorPaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
```

## Database Performance

### Traditional Offset Problems

```sql
-- SLOW: Deep offset requires counting/skipping rows
SELECT * FROM transactions 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 100000; -- Must scan 100,000 rows
```

### Cursor-Based Solution

```sql
-- FAST: Direct position using indexed column
SELECT * FROM transactions 
WHERE created_at < '2025-01-17T20:24:53.000Z'
ORDER BY created_at DESC 
LIMIT 20; -- Uses index seek
```

## Backward Compatibility

The implementation maintains full backward compatibility:
- Non-paginated requests continue to work as before
- Pagination is opt-in based on query parameters
- Existing API consumers require no changes

## Future Extensions

This implementation can be easily extended to other entities:

1. Create entity-specific repository implementing `ICursorPaginatedRepository<T>`
2. Add cursor pagination methods to service layer
3. Update controller to handle cursor query parameters
4. Configure appropriate sortable columns and caching strategies

### Recommended for Transactions Entity

```typescript
export class TransactionRepository implements ICursorPaginatedRepository<Transaction> {
  private readonly SORTABLE_COLUMNS = ['id', 'createdAt', 'amount', 'status'];
  
  async findAllCursor(options: ICursorPaginationOptions, where?: any): Promise<ICursorPaginatedResult<Transaction>> {
    // Implementation optimized for high-volume transaction data
    // Uses compound indexes on (user_id, created_at) for optimal performance
  }
}
```

## Testing

Comprehensive test coverage includes:
- Cursor encoding/decoding
- Query building with filters
- Bidirectional navigation
- Edge cases (empty results, invalid cursors)
- Caching behavior
- Repository integration
- Service and controller layers

The pattern is especially recommended for high-volume entities like transactions, logs, or event streams where performance and consistency are critical.