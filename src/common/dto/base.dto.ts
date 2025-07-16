import { IsUUID, IsDateString } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';

/**
 * Base DTO containing common fields for all DTOs
 * All DTOs should extend this class or include these fields to inherit:
 * - id: UUID identifier with validation
 * - createdAt: ISO date string with validation
 * - updatedAt: ISO date string with validation
 */
export abstract class BaseDto {
  @IsUUID()
  id: string;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

/**
 * Utility type for creating update DTOs that automatically exclude
 * fields that should never be updatable: id, createdAt, updatedAt
 *
 * Usage:
 * export class UpdateEntityDto extends CreateUpdateDto(BaseEntityDto, ['sensitiveField']) {}
 *
 * @param BaseClass - The base DTO class
 * @param additionalOmitFields - Additional fields to omit beyond the base ones
 */
export function CreateUpdateDto<T extends BaseDto, K extends keyof T>(
  BaseClass: new () => T,
  additionalOmitFields: readonly K[] = [] as readonly K[],
) {
  const fieldsToOmit = [
    'id',
    'createdAt',
    'updatedAt',
    ...additionalOmitFields,
  ] as const;
  return PartialType(OmitType(BaseClass, fieldsToOmit));
}

/**
 * Type alias for the base fields that should be omitted from update DTOs
 */
export type BaseOmitFields = 'id' | 'createdAt' | 'updatedAt';
