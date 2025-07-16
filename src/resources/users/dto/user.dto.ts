import { IsEmail, IsString, IsStrongPassword } from 'class-validator';
import { PickType, PartialType, OmitType } from '@nestjs/mapped-types';
import { BaseDto } from '../../../common/dto/base.dto';
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
] as const) { }

// Update DTO - exclude fields users shouldn't be able to update
export class UpdateUserDto extends PartialType(
  OmitType(BaseUserDto, ['id', 'createdAt', 'updatedAt', 'refreshToken'] as const),
) { }

// Internal DTO for system updates (allows refreshToken updates for auth service)
export class InternalUpdateUserDto extends PartialType(
  OmitType(BaseUserDto, ['id', 'createdAt', 'updatedAt'] as const),
) { }

// Query Params DTO - id and email are optional for filtering
export class GetUsersQueryDto extends PartialType(
  PickType(BaseUserDto, ['id', 'email'] as const),
) { }

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
    dto.createdAt = user.createdAt.toISOString();
    dto.updatedAt = user.updatedAt.toISOString();
    return dto;
  }

  static fromEntities(users: User[]): UserResponseDto[] {
    return users.map((user) => this.fromEntity(user));
  }
}
