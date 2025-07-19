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

export class BaseMembershipDto extends BaseDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  accountId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions: string[];
}

export class CreateMembershipDto extends PickType(BaseMembershipDto, [
  'userId',
  'accountId',
  'permissions',
] as const) { }

export class UpdateMembershipDto extends CreateUpdateDto(BaseMembershipDto, []) { }

export class MembershipResponseDto {
  id: string;
  userId: string;
  accountId: string;
  permissions: string[];
  createdAt: number;
  updatedAt: number;

  @Type(() => Object)
  @IsOptional()
  user?: {
    id: string;
    email: string;
  };

  @Type(() => Object)
  @IsOptional()
  account?: {
    id: string;
    name: string;
  };
}

export class UserMembershipsResponseDto {
  @IsArray()
  @Type(() => MembershipItemDto)
  memberships: MembershipItemDto[];
}

export class MembershipItemDto {
  accountId: string;
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
  accountId?: string;
}
