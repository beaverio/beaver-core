# Beaver Core Express API

A full-stack Express application with TypeScript, SuperTokens authentication, PostgreSQL database, and Redis caching - all containerized with Docker.

## Features

- 🚀 Express.js with TypeScript
- � SuperTokens self-hosted authentication
- 🐘 PostgreSQL database
- 🔴 Redis caching
- �🐳 Docker containerization with Docker Compose
- 📊 Health check endpoints
- 🛡️ Error handling middleware
- 🔍 Type safety with TypeScript

## Services

This application runs multiple services orchestrated by Docker Compose:

- **Express App** (Port 3000) - Main API server
- **SuperTokens Core** (Port 3567) - Authentication service
- **PostgreSQL** (Port 5432) - Primary database
- **Redis** (Port 6379) - Caching and session storage

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)

### Using Docker Compose (Recommended)

1. Start all services:
   ```bash
   npm run dev
   ```

2. Access the application:
   - Main API: http://localhost:3000
   - Health check: http://localhost:3000/health
   - Protected route: http://localhost:3000/protected (requires auth)
   - SuperTokens auth endpoints: http://localhost:3000/auth/*

3. Stop all services:
   ```bash
   npm run stop
   ```

4. Clean up (remove volumes):
   ```bash
   npm run clean
   ```

### Local Development

1. Start only the services (DB, Redis, SuperTokens):
   ```bash
   npm run dev:services
   ```

2. Install dependencies and run locally:
   ```bash
   npm install
   npm run dev:local
   ```

## API Endpoints

### Public Endpoints
- `GET /` - Welcome message with service status
- `GET /health` - Health check with service connectivity
- `POST /auth/signup` - User registration (SuperTokens)
- `POST /auth/signin` - User login (SuperTokens)

### Protected Endpoints
- `POST /auth/signout` - User logout (SuperTokens)

## Environment Variables

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

Key environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string  
- `SUPERTOKENS_CONNECTION_URI` - SuperTokens core service URL

## Scripts

- `npm run dev` - Start all services with Docker Compose
- `npm run dev:local` - Run app locally (requires services running)
- `npm run dev:services` - Start only DB, Redis, and SuperTokens
- `npm run build` - Build TypeScript
- `npm run start` - Start built application
- `npm run stop` - Stop Docker services
- `npm run clean` - Stop and remove all containers/volumes
- `npm run logs` - View logs from all services

## Authentication Flow

This app uses SuperTokens for authentication:

1. **Sign Up**: `POST /auth/signup` with email/password
2. **Sign In**: `POST /auth/signin` with email/password  
3. **Access Protected Routes**: Include session cookies/tokens
4. **Sign Out**: `POST /auth/signout`

## Database Schema

PostgreSQL is used as the primary database. SuperTokens automatically creates its required tables for user management and sessions.

## Development

### Development Environment Setup

This application is configured for a modern development workflow with hot reloading and Docker containerization.

#### Full Docker Development

The entire application runs in Docker with hot reload enabled:

1. **Start the development environment**:
   ```bash
   npm run dev
   ```

2. **Hot reload is automatically enabled** - changes to any file in the project will restart the server
   - TypeScript files in `src/`
   - Configuration files (`package.json`, `tsconfig.json`, etc.)
   - Docker files

3. **View logs**:
   ```bash
   docker compose logs -f express
   ```

4. **Access the application**:
   - API: http://localhost:3000
   - Auth endpoints: http://localhost:3000/auth/*

All services include health checks:
- **PostgreSQL**: Connection test
- **Redis**: Ping test  
- **SuperTokens**: HTTP endpoint test
- **Express App**: Health endpoint test

Services start in dependency order ensuring proper initialization.
