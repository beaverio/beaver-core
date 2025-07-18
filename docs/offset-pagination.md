# Offset-Based Pagination with nestjs-paginate

This application uses offset-based pagination implemented with the `nestjs-paginate` library for flexible sorting and filtering capabilities.

## Overview

Offset-based pagination provides flexible sorting and filtering options while maintaining good performance for most use cases. We use the `nestjs-paginate` library configured with `PaginationType.LIMIT_AND_OFFSET` to achieve this.

## Why Offset-Based Pagination?

1. **Flexible Sorting**: Can dynamically change sort column and direction
2. **Advanced Filtering**: Supports complex filtering operations with operators
3. **Full-Text Search**: Built-in search capabilities across multiple columns
4. **Familiar API**: Uses traditional page/limit parameters that are intuitive
5. **Library Support**: Leverages the full feature set of `nestjs-paginate`

## Implementation

### Base Repository

The `BasePaginatedRepository<T>` provides offset-based pagination for all entities using `nestjs-paginate`:

```typescript
export abstract class BasePaginatedRepository<T extends ObjectLiteral>
  implements IPaginatedRepository<T>
{
  async findPaginated(
    query: PaginateQuery,
    config?: PaginateConfig<T>,
  ): Promise<Paginated<T>> {
    const offsetConfig: PaginateConfig<T> = {
      ...paginateConfig,
      paginationType: PaginationType.LIMIT_AND_OFFSET, // Forces offset-based pagination
    };
    
    return paginate(paginateQuery, this.repository, offsetConfig);
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
      defaultSortBy: [['createdAt', 'DESC']], // Default sorting with flexible options
      searchableColumns: ['email'],
      filterableColumns: {
        email: true,
        id: true,
      },
      paginationType: PaginationType.LIMIT_AND_OFFSET, // Enables offset pagination
    };
  }
}
```

## API Usage

### Basic Pagination

```http
GET /users?page=1&limit=10
```

### Sorting by Different Columns

```http
GET /users?page=1&limit=10&sortBy=createdAt:DESC
GET /users?page=1&limit=10&sortBy=email:ASC
GET /users?page=1&limit=10&sortBy=updatedAt:DESC
```

### Advanced Filtering

```http
GET /users?page=1&limit=10&filter.email=$eq:user@example.com
GET /users?page=1&limit=10&filter.id=$in:uuid1,uuid2,uuid3
```

### Search

```http
GET /users?page=1&limit=10&search=john&searchBy=email
```

### Combined Operations

```http
GET /users?page=2&limit=5&sortBy=createdAt:DESC&filter.email=$like:%@example.com&search=john
```

### Response Format

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": 1737153851000,
      "updatedAt": 1737153851000
    }
  ],
  "meta": {
    "itemsPerPage": 10,
    "totalItems": 25,
    "currentPage": 1,
    "totalPages": 3,
    "sortBy": [["createdAt", "DESC"]],
    "searchBy": [],
    "search": "",
    "select": [],
    "filter": {}
  },
  "links": {
    "first": "/users?page=1&limit=10&sortBy=createdAt:DESC",
    "previous": "",
    "current": "/users?page=1&limit=10&sortBy=createdAt:DESC",
    "next": "/users?page=2&limit=10&sortBy=createdAt:DESC",
    "last": "/users?page=3&limit=10&sortBy=createdAt:DESC"
  }
}
```

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
      defaultSortBy: [['createdAt', 'DESC']],
      searchableColumns: ['description', 'reference'],
      filterableColumns: {
        amount: [FilterOperator.GTE, FilterOperator.LTE],
        type: true,
        status: true,
        createdAt: [FilterOperator.GTE, FilterOperator.LTE],
      },
      paginationType: PaginationType.LIMIT_AND_OFFSET,
    };
  }
}
```

## Best Practices

1. **Use indexed columns for sorting** to ensure fast queries
2. **Set appropriate default limits** (50 for users, potentially different for other entities)
3. **Leverage filtering and search** for better user experience
4. **Test with realistic datasets** to verify performance characteristics

## Caching Integration

The pagination system integrates seamlessly with the existing caching layer:

```typescript
export class UserRepository extends BasePaginatedRepository<User> {
  async findPaginated(query: PaginateQuery): Promise<Paginated<User>> {
    // Call nestjs-paginate with offset configuration
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
- Offset-based pagination logic
- Configuration validation
- Repository integration with nestjs-paginate
- Mock handling for unit tests
- Service and controller layers
- Sorting and filtering functionality

## Migration Benefits

The migration to offset-based pagination with `nestjs-paginate` provides:

1. **Reduced Code Complexity**: Leverages a mature, tested library
2. **Advanced Features**: Built-in filtering, searching, and field selection
3. **Flexible Sorting**: Can dynamically change sort column and direction
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **Maintainability**: Less custom code to maintain and debug

## Backward Compatibility

All existing API consumers continue to work without changes:
- The enhancement is additive-only
- No breaking changes to existing API contracts
- Improved sorting flexibility for all pagination requests