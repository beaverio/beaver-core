# Cursor-Based Pagination Implementation

## Overview

This document explains the cursor-based pagination implementation using `nestjs-paginate` and how it addresses performance concerns for high-volume entities like the future Transactions entity.

## Why Cursor-Based Pagination?

Traditional offset-based pagination (`LIMIT/OFFSET`) has performance issues with large datasets:

1. **Deep Offset Problem**: `OFFSET 100000` requires the database to count and skip 100,000 rows
2. **Consistency Issues**: New records can cause page shifting during pagination 
3. **Database Load**: Large offsets become exponentially slower

Cursor-based pagination solves these issues by using a cursor (encoded value) to track position instead of counting rows.

## Implementation Details

### Current User Entity Example

The User repository demonstrates both pagination approaches:

```typescript
// Standard pagination config (current default)
private readonly paginateConfig: PaginateConfig<User> = {
  paginationType: PaginationType.TAKE_AND_SKIP, // Offset-based
  sortableColumns: ['id', 'email', 'createdAt', 'updatedAt'],
  defaultSortBy: [['createdAt', 'DESC']],
  // ... other config
};

// Cursor-based pagination config
private readonly cursorPaginateConfig: PaginateConfig<User> = {
  paginationType: PaginationType.CURSOR, // Cursor-based
  sortableColumns: ['id', 'email', 'createdAt', 'updatedAt'],
  defaultSortBy: [['createdAt', 'DESC']],
  // ... other config
};
```

### API Usage Examples

#### Traditional Pagination (Current)
```bash
# First page
GET /users?page=1&limit=10&sortBy=createdAt:DESC

# Second page  
GET /users?page=2&limit=10&sortBy=createdAt:DESC
```

#### Cursor-Based Pagination (Enhanced)
```bash
# First page (no cursor needed)
GET /users/cursor?limit=10&sortBy=createdAt:DESC

# Next page (using cursor from previous response)
GET /users/cursor?cursor=V001671444000000&limit=10&sortBy=createdAt:DESC
```

### Response Format

Cursor-based responses include cursor metadata:

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2023-12-20T10:00:00.000Z",
      "updatedAt": "2023-12-20T10:00:00.000Z"
    }
  ],
  "meta": {
    "itemsPerPage": 10,
    "cursor": "V001671444000000"
  },
  "links": {
    "current": "/users/cursor?cursor=V001671444000000&limit=10",
    "next": "/users/cursor?cursor=V001671555000000&limit=10",
    "previous": "/users/cursor?cursor=V001671333000000&limit=10"
  }
}
```

## Future Transactions Entity

For the upcoming Transactions entity, cursor-based pagination will be essential:

### Recommended Configuration

```typescript
export class TransactionRepository {
  private readonly cursorPaginateConfig: PaginateConfig<Transaction> = {
    paginationType: PaginationType.CURSOR,
    sortableColumns: ['id', 'createdAt', 'amount', 'status'],
    defaultSortBy: [['createdAt', 'DESC']], // Most recent first
    searchableColumns: ['description', 'reference'],
    filterableColumns: {
      status: true,
      userId: true,
      amount: [FilterOperator.GTE, FilterOperator.LTE],
      createdAt: [FilterOperator.GTE, FilterOperator.LTE],
    },
    defaultLimit: 20,
    maxLimit: 100,
  };
}
```

### Usage Examples for Transactions

```bash
# Recent transactions for a user
GET /transactions?filter.userId=$eq:user123&sortBy=createdAt:DESC&limit=20

# Next page using cursor
GET /transactions?filter.userId=$eq:user123&cursor=V001671444000000&limit=20

# Transactions by amount range
GET /transactions?filter.amount=$gte:100&filter.amount=$lte:1000&sortBy=amount:DESC

# Search with cursor pagination
GET /transactions?search=payment&sortBy=createdAt:DESC&cursor=V001671444000000
```

## Performance Benefits

### Database Query Efficiency

**Traditional Offset (Slow)**:
```sql
SELECT * FROM transactions 
WHERE user_id = 'user123' 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 10000; -- Must count/skip 10,000 rows
```

**Cursor-Based (Fast)**:
```sql
SELECT * FROM transactions 
WHERE user_id = 'user123' 
  AND created_at < '2023-12-20T10:00:00.000Z' -- Direct position
ORDER BY created_at DESC 
LIMIT 20; -- No counting required
```

### Performance Characteristics

| Pagination Type | Small Dataset | Large Dataset | Real-time Data |
|----------------|---------------|---------------|----------------|
| Offset-based   | Fast          | Slow          | Inconsistent   |
| Cursor-based   | Fast          | Fast          | Consistent     |

## Implementation Guidelines

### When to Use Cursor Pagination

✅ **Use cursor-based pagination for**:
- High-volume entities (Transactions, Logs, Events)
- Real-time data with frequent inserts
- APIs requiring consistent pagination
- Mobile apps with infinite scroll

✅ **Use offset-based pagination for**:
- Low-volume entities (Users, Settings)
- Admin interfaces requiring page numbers
- Reports with fixed page sizes
- Backward compatibility requirements

### Best Practices

1. **Sort by Indexed Columns**: Always include indexed columns in `sortBy`
2. **Include Unique Column**: Ensure at least one unique column (like `id`) in sort
3. **Cache Cursor Results**: Cache cursor-based results for performance
4. **Handle Edge Cases**: Validate cursor format and handle expired cursors

## Caching Strategy

The implementation includes smart caching for cursor-based pagination:

```typescript
// Cache key includes cursor parameter
private generateQueryHash(query: PaginateQuery, type?: string): string {
  const queryString = JSON.stringify({
    type: type || (query.cursor ? 'cursor' : 'offset'),
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    search: query.search,
    filter: query.filter,
    select: query.select,
    cursor: query.cursor, // Included in cache key
  });
  return crypto.createHash('md5').update(queryString).digest('hex').substring(0, 8);
}
```

## Migration Strategy

To migrate existing endpoints to cursor-based pagination:

1. **Dual Support**: Implement both pagination types initially
2. **Auto-Detection**: Use cursor presence to choose pagination type
3. **Gradual Migration**: Migrate high-volume endpoints first
4. **Deprecation**: Gradually deprecate offset-based for appropriate endpoints

## Testing

Comprehensive tests cover both pagination approaches:

- Repository layer: Tests both `PaginationType.TAKE_AND_SKIP` and `PaginationType.CURSOR`
- Service layer: Tests delegation to appropriate repository methods
- Controller layer: Tests automatic detection and explicit cursor endpoints
- Caching: Tests cache key generation for both pagination types

## Conclusion

The cursor-based pagination implementation provides a foundation for high-performance pagination that will be essential for the Transactions entity and other high-volume data. The dual approach maintains backward compatibility while offering superior performance characteristics for appropriate use cases.