import { IsEmail, IsStrongPassword } from 'class-validator';
import { PickType, PartialType } from '@nestjs/mapped-types';
import { BaseDto, CreateUpdateDto } from '../../../common/dto/base.dto';
import { SanitizeText } from '../../../common/decorators/sanitize.decorator';
import { User } from '../entities/user.entity';

// Base DTO containing all possible user fields with their validations
export class BaseUserDto extends BaseDto {
  @SanitizeText()
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;

  lastLogin?: string | null;
}

// Create DTO - only requires email and password
export class CreateUserDto extends PickType(BaseUserDto, [
  'email',
  'password',
] as const) {}

// Update DTO - automatically excludes id, createdAt, updatedAt
export class UpdateUserDto extends CreateUpdateDto(BaseUserDto, [
  'lastLogin',
]) {}

// Query Params DTO - get one user by id or email
export class QueryParamsUserDto extends PartialType(
  PickType(BaseUserDto, ['id', 'email'] as const),
) {}

// Response DTO - only safe fields (no password)
export class UserResponseDto extends PickType(BaseUserDto, [
  'id',
  'email',
  'createdAt',
  'updatedAt',
  'lastLogin',
] as const) {
  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    // Convert Unix timestamp (number) to ISO string for API response
    // Handle both number and string timestamps for compatibility
    const createdAtMs =
      typeof user.createdAt === 'string'
        ? parseInt(user.createdAt, 10)
        : user.createdAt;
    const updatedAtMs =
      typeof user.updatedAt === 'string'
        ? parseInt(user.updatedAt, 10)
        : user.updatedAt;

    // Handle nullable date columns
    let lastLoginMs: number | null = null;
    if (user.lastLogin) {
      lastLoginMs =
        typeof user.lastLogin === 'string'
          ? parseInt(user.lastLogin, 10)
          : user.lastLogin;
    }

    dto.createdAt = new Date(createdAtMs).toISOString();
    dto.updatedAt = new Date(updatedAtMs).toISOString();
    dto.lastLogin =
      lastLoginMs != null ? new Date(lastLoginMs).toISOString() : null;

    return dto;
  }

  static fromEntities(users: User[]): UserResponseDto[] {
    return users.map((user) => this.fromEntity(user));
  }
}
