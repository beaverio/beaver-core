# Cursor-Based Pagination with nestjs-paginate

This application uses cursor-based pagination implemented with the `nestjs-paginate` library for optimal performance and consistency.

## Overview

Cursor-based pagination provides better performance and consistency for large datasets compared to offset-based pagination. We use the `nestjs-paginate` library configured with `PaginationType.CURSOR` to achieve this.

## Why Cursor-Based Pagination?

1. **Constant Performance**: O(1) query performance regardless of dataset size
2. **No "Deep Offset" Problem**: Eliminates slow queries when paginating through large datasets
3. **Consistency**: Results remain consistent even when data is being modified between requests
4. **Ideal for Real-Time Data**: Perfect for entities like transactions where new records are frequently inserted

## Implementation

### Base Repository

The `BasePaginatedRepository<T>` provides cursor-based pagination for all entities using `nestjs-paginate`:

```typescript
export abstract class BasePaginatedRepository<T extends ObjectLiteral>
  implements IPaginatedRepository<T>
{
  async findPaginated(
    query: PaginateQuery,
    config?: PaginateConfig<T>,
  ): Promise<Paginated<T>> {
    const cursorConfig: PaginateConfig<T> = {
      ...paginateConfig,
      paginationType: PaginationType.CURSOR, // Forces cursor-based pagination
    };
    
    return paginate(paginateQuery, this.repository, cursorConfig);
  }
}
```

### Entity Configuration

Each entity repository extends the base class and defines its pagination configuration:

```typescript
export class UserRepository extends BasePaginatedRepository<User> {
  protected getDefaultPaginateConfig(): PaginateConfig<User> {
    return {
      defaultLimit: 50,
      maxLimit: 100,
      sortableColumns: ['id', 'email', 'createdAt', 'updatedAt'],
      defaultSortBy: [['id', 'ASC']], // Consistent ordering for cursors
      searchableColumns: ['email'],
      filterableColumns: {
        email: true,
        id: true,
      },
      paginationType: PaginationType.CURSOR, // Enables cursor pagination
    };
  }
}
```

## API Usage

### Initial Request (No Cursor)

```http
GET /users?limit=10&sortBy=id:ASC
```

Response includes cursor for next page:
```json
{
  "data": [...],
  "meta": {
    "itemsPerPage": 10,
    "cursor": "eyJpZCI6InVzZXItMTAifQ==",
    "sortBy": [["id", "ASC"]],
    ...
  },
  "links": {
    "current": "/users?limit=10&sortBy=id:ASC",
    "next": "/users?cursor=eyJpZCI6InVzZXItMTAifQ==&limit=10&sortBy=id:ASC"
  }
}
```

### Subsequent Requests (With Cursor)

```http
GET /users?cursor=eyJpZCI6InVzZXItMTAifQ==&limit=10&sortBy=id:ASC
```

### Advanced Features with nestjs-paginate

#### Filtering with Cursor Pagination

```http
GET /users?filter.email=$eq:john@example.com&cursor=eyJpZCI6InVzZXItNX0=&limit=10
```

#### Search with Cursor Pagination

```http
GET /users?search=john&searchBy=email&cursor=eyJpZCI6InVzZXItNX0=&limit=10
```

#### Field Selection with Cursor Pagination

```http
GET /users?select=id,email&cursor=eyJpZCI6InVzZXItNX0=&limit=10
```

## Cursor Format

Cursors are Base64-encoded JSON objects containing the values of the sort columns:
- For `sortBy=id:ASC`, cursor might be: `{"id": "user-10"}`
- For `sortBy=createdAt:DESC,id:ASC`, cursor might be: `{"createdAt": "2023-01-01T10:00:00Z", "id": "user-5"}`

## Benefits for Future Entities

This implementation provides a solid foundation for pagination across all future entities:

### Transactions Entity (Future)

When implementing a high-volume Transactions entity:

```typescript
export class TransactionRepository extends BasePaginatedRepository<Transaction> {
  protected getDefaultPaginateConfig(): PaginateConfig<Transaction> {
    return {
      defaultLimit: 50,
      maxLimit: 100,
      sortableColumns: ['id', 'amount', 'createdAt', 'updatedAt', 'type', 'status'],
      defaultSortBy: [['createdAt', 'DESC'], ['id', 'ASC']], // Time-based with tie-breaker
      searchableColumns: ['description', 'reference'],
      filterableColumns: {
        amount: [FilterOperator.GTE, FilterOperator.LTE],
        type: true,
        status: true,
        createdAt: [FilterOperator.GTE, FilterOperator.LTE],
      },
      paginationType: PaginationType.CURSOR,
    };
  }
}
```

### Performance Characteristics

- **First page**: Direct index lookup (very fast)
- **Deep pagination**: Still fast, uses index on sort column
- **Consistency**: Results don't shift when new data is inserted
- **Scalability**: Performance remains constant with millions of records

## Database Performance Comparison

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

## Best Practices

1. **Always include a unique column in sort order** (like `id`) as a tie-breaker
2. **Use indexed columns for sorting** to ensure fast cursor queries
3. **Set appropriate default limits** (50 for users, potentially different for other entities)
4. **Consider time-based sorting** for chronological data like transactions
5. **Test with large datasets** to verify performance characteristics

## Caching Integration

The pagination system integrates seamlessly with the existing caching layer:

```typescript
export class UserRepository extends BasePaginatedRepository<User> {
  async findPaginated(query: PaginateQuery): Promise<Paginated<User>> {
    // Call nestjs-paginate with cursor configuration
    const result = await super.findPaginated(query);
    
    // Cache individual entities from paginated results
    for (const user of result.data) {
      await this.cacheEntity(user);
    }
    
    return result;
  }
}
```

## Testing

Comprehensive test coverage includes:
- Cursor-based pagination logic
- Configuration validation
- Repository integration with nestjs-paginate
- Mock handling for unit tests
- Service and controller layers

## Migration Benefits

The migration to cursor-based pagination with `nestjs-paginate` provides:

1. **Reduced Code Complexity**: Leverages a mature, tested library
2. **Advanced Features**: Built-in filtering, searching, and field selection
3. **Type Safety**: Full TypeScript support with proper interfaces
4. **Maintainability**: Less custom code to maintain and debug
5. **Performance**: Proven cursor-based pagination implementation

## Backward Compatibility

All existing API consumers continue to work without changes:
- The enhancement is additive-only
- No breaking changes to existing API contracts
- Performance improves automatically for all pagination requests