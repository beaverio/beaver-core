import { IsEmail, IsStrongPassword } from 'class-validator';
import { PickType, PartialType } from '@nestjs/mapped-types';
import { BaseDto, CreateUpdateDto } from '../../../common/dto/base.dto';
import { User } from '../entities/user.entity';

// Base DTO containing all possible user fields with their validations
export class BaseUserDto extends BaseDto {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;
}

// Create DTO - only requires email and password
export class CreateUserDto extends PickType(BaseUserDto, [
  'email',
  'password',
] as const) {}

// Update DTO - automatically excludes id, createdAt, updatedAt
export class UpdateUserDto extends CreateUpdateDto(BaseUserDto, []) {}

// Query Params DTO - id and email are optional for filtering
export class QueryParamsUserDto extends PartialType(
  PickType(BaseUserDto, ['id', 'email'] as const),
) {}

// Response DTO - only safe fields (no password)
export class UserResponseDto extends PickType(BaseUserDto, [
  'id',
  'email',
  'createdAt',
  'updatedAt',
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

    dto.createdAt = new Date(createdAtMs).toISOString();
    dto.updatedAt = new Date(updatedAtMs).toISOString();
    return dto;
  }

  static fromEntities(users: User[]): UserResponseDto[] {
    return users.map((user) => this.fromEntity(user));
  }
}
