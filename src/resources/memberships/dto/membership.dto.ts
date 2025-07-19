import {
  IsUUID,
  IsArray,
  IsString,
  ArrayNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMembershipDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  accountId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions: string[];
}

export class UpdateMembershipDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions: string[];
}

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
