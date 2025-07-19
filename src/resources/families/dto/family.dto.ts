import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsString, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { SanitizeText } from '../../../common/decorators/sanitize.decorator';
import { BaseDto, CreateUpdateDto } from '../../../common/dto/base.dto';
import { Family } from '../entities/family.entity';

export class FamilyDto extends BaseDto {
  @SanitizeText()
  @IsString()
  name: string;
}

// Upsert DTO - everything is optional
export class UpsertFamilyDto extends CreateUpdateDto(FamilyDto, []) {}

// Query Params DTO - get one family by id
export class QueryParamsFamilyDto extends PartialType(
  PickType(FamilyDto, ['id'] as const),
) {}

export class FamilyResponseDto extends PickType(FamilyDto, [
  'id',
  'createdAt',
  'updatedAt',
  'name',
] as const) {
  @IsArray()
  @IsOptional()
  @Type(() => FamilyMembershipItemDto)
  memberships?: FamilyMembershipItemDto[];

  static fromEntity(family: Family): FamilyResponseDto {
    const dto = new FamilyResponseDto();
    dto.id = family.id;
    dto.name = family.name;
    // Convert Unix timestamp (number) to ISO string for API response
    // Handle both number and string timestamps for compatibility
    const createdAtMs =
      typeof family.createdAt === 'string'
        ? parseInt(family.createdAt, 10)
        : family.createdAt;
    const updatedAtMs =
      typeof family.updatedAt === 'string'
        ? parseInt(family.updatedAt, 10)
        : family.updatedAt;

    dto.createdAt = new Date(createdAtMs).toISOString();
    dto.updatedAt = new Date(updatedAtMs).toISOString();

    // Include memberships if they are loaded
    if (family.memberships) {
      dto.memberships = family.memberships.map((membership) => ({
        userId: membership.userId,
        permissions: membership.permissions,
      }));
    }

    return dto;
  }

  static fromEntities(families: Family[]): FamilyResponseDto[] {
    return families.map((family) => this.fromEntity(family));
  }
}

export class FamilyMembershipItemDto {
  userId: string;
  permissions: string[];
}