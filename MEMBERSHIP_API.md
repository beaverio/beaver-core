# Membership API Documentation

## Overview
The Membership feature implements a many-to-many relationship between Users and Accounts with associated permissions arrays. This provides the foundation for a multi-tenant permission system.

## API Endpoints

### Core Membership CRUD

#### POST /memberships
Creates a new membership with permissions.

**Request Body:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174001",
  "accountId": "123e4567-e89b-12d3-a456-426614174002", 
  "permissions": ["account:read", "account:write"]
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "123e4567-e89b-12d3-a456-426614174001",
  "accountId": "123e4567-e89b-12d3-a456-426614174002",
  "permissions": ["account:read", "account:write"],
  "createdAt": 1674123456789,
  "updatedAt": 1674123456789,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "email": "user@example.com"
  },
  "account": {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "name": "Example Account"
  }
}
```

#### GET /memberships/:id
Retrieves a specific membership by ID.

#### PATCH /memberships/:id
Updates membership permissions.

**Request Body:**
```json
{
  "permissions": ["account:read", "transaction:read"]
}
```

#### DELETE /memberships/:id
Deletes a specific membership.

#### GET /memberships
Retrieves paginated list of memberships with filtering and sorting.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `sortBy`: Sort field (createdAt, updatedAt, id)
- `filter`: Filter by userId, accountId, or id

### Relationship-based Endpoints

#### GET /users/:userId/memberships
Returns user's memberships in the specified format for multi-tenant access.

**Response:**
```json
{
  "memberships": [
    {
      "accountId": "123e4567-e89b-12d3-a456-426614174002",
      "permissions": ["account:read", "account:write"]
    },
    {
      "accountId": "123e4567-e89b-12d3-a456-426614174003", 
      "permissions": ["account:read"]
    }
  ]
}
```

#### GET /accounts/:accountId/memberships  
Returns all memberships for a specific account.

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "123e4567-e89b-12d3-a456-426614174001",
    "accountId": "123e4567-e89b-12d3-a456-426614174002",
    "permissions": ["account:read", "account:write"],
    "createdAt": 1674123456789,
    "updatedAt": 1674123456789,
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174001", 
      "email": "user@example.com"
    }
  }
]
```

## Database Schema

### Memberships Table
- `id`: UUID primary key
- `userId`: UUID foreign key to users table (CASCADE DELETE)
- `accountId`: UUID foreign key to accounts table (CASCADE DELETE) 
- `permissions`: Text array stored as comma-separated values
- `createdAt`: Unix timestamp in milliseconds
- `updatedAt`: Unix timestamp in milliseconds
- **Unique constraint**: (userId, accountId) to prevent duplicates

### Relationships
- **User** ← 1:N → **Membership** ← N:1 → **Account**
- When a User is deleted, all their memberships are automatically deleted
- When an Account is deleted, all its memberships are automatically deleted

## Security & Authorization
- All endpoints require JWT authentication
- Users can only manage their own memberships (authorization rules to be implemented)
- Input validation for UUID formats and permission arrays
- Prevents duplicate memberships for the same user-account pair

## Error Handling
- `400 Bad Request`: Invalid user or account ID
- `401 Unauthorized`: Missing or invalid JWT token  
- `404 Not Found`: Membership, user, or account not found
- `409 Conflict`: Duplicate membership already exists

## Caching
- Individual memberships cached for 30 minutes
- User memberships list cached for 30 minutes
- Account memberships list cached for 30 minutes
- Cache invalidation on create, update, delete operations

## Implementation Notes
- Uses TypeORM `simple-array` for permissions storage
- Implements pagination with nestjs-paginate
- Comprehensive test coverage (100% for new code)
- Follows existing repository patterns with caching
- No permission validation or enforcement - data storage only