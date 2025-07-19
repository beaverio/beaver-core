import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { SanitizeText } from '../../../common/decorators/sanitize.decorator';
import { BaseDto, CreateUpdateDto } from '../../../common/dto/base.dto';
import { Account } from '../entities/account.entity';

export class AccountDto extends BaseDto {
  @SanitizeText()
  @IsString()
  name: string;
}

// Upsert DTO - everything is optional
export class UpsertAccountDto extends CreateUpdateDto(AccountDto, []) {}

// Query Params DTO - get one account by id
export class QueryParamsAccountDto extends PartialType(
  PickType(AccountDto, ['id'] as const),
) {}

export class AccountResponseDto extends PickType(AccountDto, [
  'id',
  'createdAt',
  'updatedAt',
  'name',
] as const) {
  static fromEntity(account: Account): AccountResponseDto {
    const dto = new AccountResponseDto();
    dto.id = account.id;
    dto.name = account.name;
    // Convert Unix timestamp (number) to ISO string for API response
    // Handle both number and string timestamps for compatibility
    const createdAtMs =
      typeof account.createdAt === 'string'
        ? parseInt(account.createdAt, 10)
        : account.createdAt;
    const updatedAtMs =
      typeof account.updatedAt === 'string'
        ? parseInt(account.updatedAt, 10)
        : account.updatedAt;

    dto.createdAt = new Date(createdAtMs).toISOString();
    dto.updatedAt = new Date(updatedAtMs).toISOString();

    return dto;
  }

  static fromEntities(accounts: Account[]): AccountResponseDto[] {
    return accounts.map((account) => this.fromEntity(account));
  }
}
