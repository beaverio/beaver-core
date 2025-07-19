# 🚫 NOTICE: This Repository is READ-ONLY

## ⚠️ Important Restrictions

- **NO CLONING**: This repository should not be cloned, forked, or downloaded
- **NO COMMERCIAL USE**: This code is not licensed for commercial use
- **VIEWING ONLY**: You may view the code for learning purposes only

## 📧 Contact

If you're interested in using this code or have questions, please contact:
- GitHub: [@ConnorDBurge]

## 🔒 License

All rights reserved. This code is proprietary and confidential.

---

# Beaver Core - NestJS Backend

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## DTO Pattern

This project uses a base DTO pattern with NestJS mapped-types to reduce maintenance overhead and eliminate duplicate validation logic:

### Base DTO Approach
- **BaseUserDto**: Contains all possible user fields with their validation decorators
- **Derived DTOs**: Use `PickType` and `PartialType` from `@nestjs/mapped-types` for specific use cases
- **Type Safety**: Maintains full TypeScript type safety and validation
- **DRY Principle**: Eliminates duplicate validation logic across DTOs

### Example Implementation
```typescript
// Base DTO with all fields and validations
export class BaseUserDto {
  @IsUUID()
  id: string;

  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsString()
  refreshToken: string;
}

// Derived DTOs using mapped types
export class CreateUserDto extends PickType(BaseUserDto, ['email', 'password'] as const) {}
export class UpdateUserDto extends PartialType(PickType(BaseUserDto, ['email', 'password', 'refreshToken'] as const)) {}
```

### Benefits
- **Maintainability**: Adding new fields only requires updating the base DTO
- **Consistency**: All DTOs automatically inherit the same validation rules
- **Type Safety**: Full TypeScript support with IntelliSense
- **Scalability**: Easy to extend for new entities and use cases

## Rate Limiting

This application implements global rate limiting to protect against abuse, brute-force attacks, and excessive traffic. The rate limiting is implemented using `@nestjs/throttler` and applies to all endpoints by default.

### Configuration

Rate limiting can be configured using environment variables:

- `RATE_LIMIT_TTL`: Time window in seconds (default: 60)
- `RATE_LIMIT_LIMIT`: Maximum number of requests per time window (default: 100)

### Example Configuration

```bash
# .env file
RATE_LIMIT_TTL=60        # 60 seconds
RATE_LIMIT_LIMIT=100     # 100 requests per minute
```

### Response Headers

When rate limiting is active, the following headers are included in responses:

- `X-RateLimit-Limit`: Maximum number of requests allowed
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Time when the rate limit window resets

### Rate Limit Exceeded Response

When the rate limit is exceeded, the API returns a `429 Too Many Requests` response:

```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too Many Requests"
}
```

### Customizing Rate Limits

The rate limiting implementation supports future enhancements such as:
- Per-user or per-IP specific limits
- Custom rate limits for sensitive endpoints (login, signup)
- Distributed rate limiting with Redis backend

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
