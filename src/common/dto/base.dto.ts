import { IsUUID, IsDateString } from 'class-validator';

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