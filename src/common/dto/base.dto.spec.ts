import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { IsString } from 'class-validator';
import { BaseDto, CreateUpdateDto } from './base.dto';

// Test DTO extending BaseDto
class TestEntityDto extends BaseDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  sensitiveField: string;
}

// Test Update DTO using the utility
class TestUpdateDto extends CreateUpdateDto(TestEntityDto, ['sensitiveField']) {}

describe('BaseDto and CreateUpdateDto Utility', () => {
  describe('BaseDto', () => {
    it('should contain id, createdAt, and updatedAt fields', () => {
      const testDto = new TestEntityDto();
      expect('id' in testDto).toBe(true);
      expect('createdAt' in testDto).toBe(true);
      expect('updatedAt' in testDto).toBe(true);
    });
  });

  describe('CreateUpdateDto Utility', () => {
    it('should automatically exclude id, createdAt, updatedAt from validation', async () => {
      // Test that the utility properly creates a type that excludes the specified fields
      // The real test is whether the DTO validates correctly and doesn't include excluded fields in its schema
      
      const validData = {
        name: 'Test Name',
        description: 'Test Description',
      };

      const dto = plainToClass(TestUpdateDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      
      // Test that the UpdateDto doesn't validate excluded fields
      // If we try to validate with invalid data for excluded fields, they should be ignored
      const dataWithExcludedFields = {
        name: 'Test Name',
        description: 'Test Description',
        id: 'invalid-id', // Should be UUID but should be ignored
        createdAt: 'invalid-date', // Should be ISO date but should be ignored
        updatedAt: 'invalid-date', // Should be ISO date but should be ignored
        sensitiveField: 'should-be-ignored',
      };

      const dtoWithExtra = plainToClass(TestUpdateDto, dataWithExcludedFields);
      const errorsWithExtra = await validate(dtoWithExtra);
      
      // Should still be valid because excluded fields are not validated
      expect(errorsWithExtra).toHaveLength(0);
    });

    it('should validate correctly with allowed fields', async () => {
      const validData = {
        name: 'Test Name',
        description: 'Test Description',
      };

      const dto = plainToClass(TestUpdateDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should make all fields optional (PartialType behavior)', async () => {
      // Empty object should be valid since all fields are optional
      const dto = plainToClass(TestUpdateDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate individual field constraints', async () => {
      const invalidData = {
        name: 123, // Should be string
        description: 'Valid Description',
      };

      const dto = plainToClass(TestUpdateDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });
  });
});