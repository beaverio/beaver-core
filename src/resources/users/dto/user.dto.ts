import { IsEmail, IsString, IsStrongPassword } from 'class-validator';
import { PickType, PartialType } from '@nestjs/mapped-types';
import { BaseDto, CreateUpdateDto } from '../../../common/dto/base.dto';
import { User } from '../entities/user.entity';

// Base DTO containing all possible user fields with their validations
export class BaseUserDto extends BaseDto {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsString()
  refreshToken: string;
}

// Create DTO - only requires email and password
export class CreateUserDto extends PickType(BaseUserDto, [
  'email',
  'password',
] as const) {}

// Update DTO - automatically excludes id, createdAt, updatedAt, and refreshToken
export class UpdateUserDto extends CreateUpdateDto(BaseUserDto, [
  'refreshToken',
]) {}

// Internal DTO for system updates - automatically excludes id, createdAt, updatedAt
export class InternalUpdateUserDto extends CreateUpdateDto(BaseUserDto, []) {}

// Query Params DTO - id and email are optional for filtering
export class QueryParamsUserDto extends PartialType(
  PickType(BaseUserDto, ['id', 'email'] as const),
) {}

// Response DTO - only safe fields (no password or refreshToken)
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
    dto.createdAt =
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : user.createdAt;
    dto.updatedAt =
      user.updatedAt instanceof Date
        ? user.updatedAt.toISOString()
        : user.updatedAt;
    return dto;
  }

  static fromEntities(users: User[]): UserResponseDto[] {
    return users.map((user) => this.fromEntity(user));
  }
}
