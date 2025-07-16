# Redis Caching Implementation

This document provides examples of how to use the Redis caching system implemented in beaver-core.

## Environment Setup

Ensure you have the required environment variable set:

```bash
# Required for Redis connection
REDIS_URL=redis://localhost:6379

# Optional: Enable cache warmup on startup
CACHE_WARMUP_ENABLED=true

# Existing JWT configuration (required)
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRATION=900
JWT_REFRESH_EXPIRATION=604800
```

## Usage Examples

### User Caching
The system automatically caches user lookups:

```typescript
// First call - hits database, caches result
const user1 = await userService.getUser({ id: 'user-123' });

// Second call - hits cache, much faster
const user2 = await userService.getUser({ id: 'user-123' });

// Updates invalidate cache automatically
await userService.updateUser('user-123', { email: 'new@email.com' });

// Next call hits database again, re-caches result
const user3 = await userService.getUser({ id: 'user-123' });
```

### Session Management
Enhanced authentication with session revocation:

```bash
# Login - creates session
POST /auth/signin
# Cookies: authentication=jwt_token; refresh=refresh_token

# Logout from current device
POST /auth/logout

# Logout from all devices
POST /auth/logout-all

# Get active session count
POST /auth/sessions/count
# Response: { "activeSessionCount": 3 }
```

### Health Monitoring

```bash
# General health check
GET /health
# Response: { "status": "ok", "services": { "cache": "healthy" } }

# Cache-specific health
GET /health/cache
# Response: { "status": "healthy", "metrics": { "hits": 150, "misses": 10 } }

# Cache metrics only
GET /health/cache/metrics
# Response: { "hits": 150, "misses": 10, "keys": 0, "memory": 0 }
```

### Cache Management

```bash
# Trigger cache warmup
POST /health/cache/warmup
# Response: { "success": true, "message": "Cache warmup completed successfully" }

# Clear and reload cache
POST /health/cache/reload
# Response: { "success": true, "message": "Cache reloaded successfully" }
```

## Architecture Benefits

1. **Performance**: User lookups are cached for 30 minutes, reducing database load
2. **Security**: Refresh tokens can be revoked, enabling proper logout functionality
3. **Scalability**: Foundation for rate limiting and real-time features
4. **Monitoring**: Built-in health checks and metrics for production readiness
5. **Resilience**: Graceful degradation when Redis is unavailable

## Cache Key Structure

- **User by ID**: `user:id:{uuid}`
- **User by Email**: `user:email:{email}`
- **User Sessions**: `user_sessions:{userId}`
- **Session Data**: `session:{userId}:{tokenHash}`

## TTL Configuration

- **User Cache**: 30 minutes (1800 seconds)
- **Session Cache**: Matches JWT refresh token expiration
- **Health Check**: 1 second (for testing)

The implementation follows the cache-aside pattern with automatic invalidation on updates, ensuring data consistency while maximizing performance benefits.