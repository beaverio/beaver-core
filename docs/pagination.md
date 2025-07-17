# Pagination System Documentation

This document explains the simplified pagination system implemented using `nestjs-paginate` library.

## Overview

The pagination system has been completely rewritten to use the `nestjs-paginate` library, making it much simpler and more powerful than the previous custom cursor-based implementation.

## Key Features

### 🎯 Always Paginated
- **All user queries are now paginated by default** with a limit of 50 items per page
- No more non-paginated endpoints that could return all users from the database
- Better performance and consistent API behavior

### 🔧 Generic & Reusable
- **`BasePaginatedRepository<T>`**: A base class that any entity repository can extend
- **`IPaginatedRepository<T>`**: Interface for consistent pagination across all entities
- Easy to add pagination to new entities by extending the base repository

### 📊 Rich Query Capabilities
The `nestjs-paginate` library provides powerful querying out of the box:

```typescript
// Basic pagination
GET /users?page=1&limit=20

// Sorting
GET /users?sortBy=createdAt:DESC,email:ASC

// Filtering
GET /users?filter.email=$eq:user@example.com

// Search
GET /users?search=john&searchBy=email

// Field selection
GET /users?select=id,email
```

### 🏗️ Clean Architecture
```
Controller  →  Service  →  Repository  →  nestjs-paginate
     ↓            ↓           ↓              ↓
PaginateQuery → PaginateQuery → findPaginated() → Paginated<T>
```

## Implementation Details

### Base Repository
```typescript
export abstract class BasePaginatedRepository<T extends ObjectLiteral> 
  implements IPaginatedRepository<T> {
  
  protected abstract getDefaultPaginateConfig(): PaginateConfig<T>;
  
  async findPaginated(query: PaginateQuery): Promise<Paginated<T>> {
    // Ensures default limit of 50 if not provided
    // Delegates to nestjs-paginate for heavy lifting
  }
}
```

### User Repository Example
```typescript
export class UserRepository extends BasePaginatedRepository<User> 
  implements IUserRepository {
  
  protected getDefaultPaginateConfig(): PaginateConfig<User> {
    return {
      defaultLimit: 50,
      maxLimit: 100,
      sortableColumns: ['id', 'email', 'createdAt', 'updatedAt'],
      defaultSortBy: [['createdAt', 'DESC']],
      searchableColumns: ['email'],
      filterableColumns: {
        email: true,
        id: true,
      },
    };
  }
}
```

### Controller Usage
```typescript
@Get()
async getUsers(
  @Paginate() query: PaginateQuery,
): Promise<Paginated<UserResponseDto>> {
  const result = await this.usersService.getUsers(query);
  const transformedData = UserResponseDto.fromEntities(result.data);
  
  return {
    ...result,
    data: transformedData,
  } as Paginated<UserResponseDto>;
}
```

## API Response Format

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
  "meta": {
    "itemsPerPage": 50,
    "totalItems": 125,
    "currentPage": 1,
    "totalPages": 3,
    "sortBy": [["createdAt", "DESC"]],
    "searchBy": [],
    "search": "",
    "select": [],
    "filter": {}
  },
  "links": {
    "first": "?limit=50",
    "current": "?page=1&limit=50", 
    "next": "?page=2&limit=50",
    "last": "?page=3&limit=50"
  }
}
```

## Adding Pagination to New Entities

To add pagination to a new entity (e.g., `Transaction`):

1. **Extend the base repository**:
```typescript
export class TransactionRepository extends BasePaginatedRepository<Transaction> {
  protected getDefaultPaginateConfig(): PaginateConfig<Transaction> {
    return {
      defaultLimit: 50,
      maxLimit: 100,
      sortableColumns: ['id', 'amount', 'createdAt'],
      defaultSortBy: [['createdAt', 'DESC']],
      searchableColumns: ['description'],
      filterableColumns: {
        userId: true,
        type: true,
        status: true,
      },
    };
  }
}
```

2. **Update the interface**:
```typescript
export interface ITransactionRepository 
  extends ICacheableRepository<Transaction>, IPaginatedRepository<Transaction> {
  // entity-specific methods
}
```

3. **Update the service**:
```typescript
async getTransactions(query: PaginateQuery): Promise<Paginated<Transaction>> {
  return await this.transactionRepository.findPaginated(query);
}
```

4. **Update the controller**:
```typescript
@Get()
async getTransactions(
  @Paginate() query: PaginateQuery,
): Promise<Paginated<TransactionResponseDto>> {
  // Same pattern as users
}
```

## Benefits Over Previous Implementation

### ✅ Simplicity
- **90% less code** - no custom cursor encoding/decoding logic
- **No complex caching strategies** for pagination results
- **Standardized query syntax** across all endpoints

### ✅ Performance
- **Built-in optimizations** from nestjs-paginate library
- **Efficient database queries** with proper LIMIT/OFFSET handling
- **No deep offset problems** for reasonable pagination depths

### ✅ Maintainability  
- **Well-tested library** instead of custom pagination logic
- **Consistent behavior** across all paginated endpoints
- **Easy to extend** for new entities and requirements

### ✅ Developer Experience
- **Rich query capabilities** out of the box
- **Type-safe** with full TypeScript support
- **Self-documenting** API with standard query parameters

## Migration Notes

### Removed Components
- ❌ `ICursorPaginationOptions` interface
- ❌ `ICursorPaginatedResult<T>` interface  
- ❌ `CursorPaginationQueryDto` class
- ❌ `CursorPaginatedResponseDto<T>` class
- ❌ Custom cursor encoding/decoding logic
- ❌ Complex cursor caching strategies

### Added Components
- ✅ `IPaginatedRepository<T>` interface
- ✅ `BasePaginatedRepository<T>` abstract class
- ✅ Simple, consistent pagination configuration
- ✅ Integration with `nestjs-paginate` library

The new implementation provides all the pagination functionality needed for current and future entities while being much simpler to understand, maintain, and extend.