import { IsEmail, IsString, IsStrongPassword, IsUUID } from 'class-validator';
import { PickType, PartialType } from '@nestjs/mapped-types';
import { User } from '../entities/user.entity';

// Base DTO containing all possible user fields with their validations
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

// Create DTO - only requires email and password
export class CreateUserDto extends PickType(BaseUserDto, [
  'email',
  'password',
] as const) {}

// Update DTO - all fields optional except id
export class UpdateUserDto extends PartialType(
  PickType(BaseUserDto, ['email', 'password', 'refreshToken'] as const),
) {}

// Query DTO - id and email are optional for filtering
export class GetUsersQueryDto extends PartialType(
  PickType(BaseUserDto, ['id', 'email'] as const),
) {}

// Response DTO - only safe fields (no password or refreshToken)
export class UserResponseDto extends PickType(BaseUserDto, [
  'id',
  'email',
] as const) {
  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    return dto;
  }

  static fromEntities(users: User[]): UserResponseDto[] {
    return users.map((user) => this.fromEntity(user));
  }
}
