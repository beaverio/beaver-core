import { IsEmail, IsOptional, IsString, IsStrongPassword, IsUUID } from 'class-validator';
import { User } from '../entities/user.entity';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsStrongPassword()
  password?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class GetUsersQueryDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

// Response DTOs
export class UserResponseDto {
  id: string;
  email: string;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    return dto;
  }

  static fromEntities(users: User[]): UserResponseDto[] {
    return users.map(user => this.fromEntity(user));
  }
}
