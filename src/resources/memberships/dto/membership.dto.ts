import {
  IsUUID,
  IsArray,
  IsString,
  ArrayNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseDto, CreateUpdateDto } from 'src/common/dto/base.dto';
import { PickType } from '@nestjs/mapped-types';
import { Membership } from '../entities/membership.entity';

export class BaseMembershipDto extends BaseDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  familyId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions: string[];
}

export class CreateMembershipDto extends PickType(BaseMembershipDto, [
  'userId',
  'familyId',
  'permissions',
] as const) {}

export class UpdateMembershipDto extends CreateUpdateDto(
  BaseMembershipDto,
  [],
) {}

export class MembershipResponseDto extends PickType(BaseMembershipDto, [
  'id',
  'userId',
  'familyId',
  'permissions',
  'createdAt',
  'updatedAt',
] as const) {
  @Type(() => Object)
  @IsOptional()
  user?: {
    id: string;
    email: string;
  };

  @Type(() => Object)
  @IsOptional()
  family?: {
    id: string;
    name: string;
  };

  static fromEntity(membership: Membership): MembershipResponseDto {
    const dto = new MembershipResponseDto();
    dto.id = membership.id;
    dto.userId = membership.userId;
    dto.familyId = membership.familyId;
    dto.permissions = membership.permissions;

    // Convert Unix timestamp (number) to ISO string for API response
    // Handle both number and string timestamps for compatibility
    const createdAtMs = membership.createdAt
      ? typeof membership.createdAt === 'string'
        ? parseInt(membership.createdAt, 10)
        : membership.createdAt
      : Date.now();
    const updatedAtMs = membership.updatedAt
      ? typeof membership.updatedAt === 'string'
        ? parseInt(membership.updatedAt, 10)
        : membership.updatedAt
      : Date.now();

    dto.createdAt = new Date(createdAtMs).toISOString();
    dto.updatedAt = new Date(updatedAtMs).toISOString();

    // Include related user data if available
    if (membership.user) {
      dto.user = {
        id: membership.user.id,
        email: membership.user.email,
      };
    }

    // Include related family data if available
    if (membership.family) {
      dto.family = {
        id: membership.family.id,
        name: membership.family.name,
      };
    }

    return dto;
  }

  static fromEntities(memberships: Membership[]): MembershipResponseDto[] {
    return memberships.map((membership) => this.fromEntity(membership));
  }
}

export class UserMembershipsResponseDto {
  @IsArray()
  @Type(() => MembershipItemDto)
  memberships: MembershipItemDto[];
}

export class MembershipItemDto {
  familyId: string;
  permissions: string[];
}

export class QueryParamsMembershipDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  familyId?: string;
}
