# Beaver Core Express API

A bare bones Express application built with TypeScript and Docker.

## Features

- 🚀 Express.js with TypeScript
- 🐳 Docker containerization
- 🔧 Docker Compose for easy development
- 📊 Health check endpoint
- 🛡️ Error handling middleware
- 🔍 Type safety with TypeScript

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)

### Using Docker Compose (Recommended)

1. Build and start the application:
   ```bash
   docker-compose up --build
   ```

2. Access the application:
   - Main endpoint: http://localhost:3000
   - Health check: http://localhost:3000/health

3. Stop the application:
   ```bash
   docker-compose down
   ```

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

- `GET /` - Welcome message with timestamp
- `GET /health` - Health check endpoint

## Docker Commands

- Build image: `docker build -t beaver-core-express .`
- Run container: `docker run -p 3000:3000 beaver-core-express`
- View logs: `docker-compose logs -f`

## Project Structure

```
├── src/
│   └── index.ts          # Main application file
├── dist/                 # Built JavaScript (generated)
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile           # Docker image configuration
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```
