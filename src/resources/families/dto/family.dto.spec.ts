import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  UpsertFamilyDto,
  QueryParamsFamilyDto,
  FamilyResponseDto,
} from './family.dto';
import { Family } from '../entities/family.entity';

// Helper function to create mock Family with all required properties
const createMockFamily = (overrides: Partial<Family> = {}): Family => {
  const timestamp = Date.now();
  const baseFamily = {
    id: '1',
    name: 'Test Family',
    createdAt: timestamp,
    updatedAt: timestamp,
    setCreationTimestamps: jest.fn(),
    setUpdateTimestamp: jest.fn(),
    ...overrides,
  };

  // Add getter properties with proper typing
  Object.defineProperty(baseFamily, 'createdAtDate', {
    get: function (this: { createdAt: number }) {
      return new Date(this.createdAt);
    },
  });
  Object.defineProperty(baseFamily, 'updatedAtDate', {
    get: function (this: { updatedAt: number }) {
      return new Date(this.updatedAt);
    },
  });

  return baseFamily as Family;
};

describe('Family DTO Behavior Tests', () => {
  describe('UpsertFamilyDto', () => {
    it('should validate correctly with valid data', async () => {
      const validData = {
        name: 'Valid Family Name',
      };
      const dto = plainToClass(UpsertFamilyDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate correctly with empty data (all optional)', async () => {
      const emptyData = {};
      const dto = plainToClass(UpsertFamilyDto, emptyData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid data types', async () => {
      const invalidData = { name: 123 }; // number instead of string
      const dto = plainToClass(UpsertFamilyDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should exclude system fields for security', () => {
      const upsertDto = new UpsertFamilyDto();
      expect('id' in upsertDto).toBe(false);
      expect('createdAt' in upsertDto).toBe(false);
      expect('updatedAt' in upsertDto).toBe(false);
    });
  });

  describe('QueryParamsFamilyDto', () => {
    it('should validate correctly with id parameter', async () => {
      const validData = { id: '123e4567-e89b-12d3-a456-426614174000' }; // Valid UUID
      const dto = plainToClass(QueryParamsFamilyDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate correctly with empty data (all optional)', async () => {
      const emptyData = {};
      const dto = plainToClass(QueryParamsFamilyDto, emptyData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid UUID format', async () => {
      const invalidData = { id: 'not-a-uuid' };
      const dto = plainToClass(QueryParamsFamilyDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('FamilyResponseDto', () => {
    it('should transform entity correctly with all required fields', () => {
      const family = createMockFamily({
        id: 'test-uuid',
        name: 'Response Family',
        createdAt: new Date('2023-01-01T00:00:00Z').getTime(),
        updatedAt: new Date('2023-01-01T12:00:00Z').getTime(),
      });

      const responseDto = FamilyResponseDto.fromEntity(family);

      expect(responseDto.id).toBe('test-uuid');
      expect(responseDto.name).toBe('Response Family');
      expect(responseDto.createdAt).toBe('2023-01-01T00:00:00.000Z');
      expect(responseDto.updatedAt).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should transform multiple entities correctly', () => {
      const families = [
        createMockFamily({
          id: '1',
          name: 'Family One',
          createdAt: new Date('2023-01-01T00:00:00Z').getTime(),
          updatedAt: new Date('2023-01-01T12:00:00Z').getTime(),
        }),
        createMockFamily({
          id: '2',
          name: 'Family Two',
          createdAt: new Date('2023-01-02T00:00:00Z').getTime(),
          updatedAt: new Date('2023-01-02T12:00:00Z').getTime(),
        }),
      ];

      const responseDtos = FamilyResponseDto.fromEntities(families);

      expect(responseDtos).toHaveLength(2);
      expect(responseDtos[0].id).toBe('1');
      expect(responseDtos[0].name).toBe('Family One');
      expect(responseDtos[1].id).toBe('2');
      expect(responseDtos[1].name).toBe('Family Two');
      expect(responseDtos[0].createdAt).toBe('2023-01-01T00:00:00.000Z');
      expect(responseDtos[1].updatedAt).toBe('2023-01-02T12:00:00.000Z');
    });

    it('should handle string timestamps correctly', () => {
      const family = createMockFamily({
        id: 'test-uuid',
        name: 'String Timestamp Family',
        createdAt: '1672531200000' as any, // String timestamp
        updatedAt: '1672574400000' as any, // String timestamp
      });

      const responseDto = FamilyResponseDto.fromEntity(family);

      expect(responseDto.createdAt).toBe('2023-01-01T00:00:00.000Z');
      expect(responseDto.updatedAt).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should handle numeric timestamps correctly', () => {
      const family = createMockFamily({
        id: 'test-uuid',
        name: 'Numeric Timestamp Family',
        createdAt: 1672531200000, // Numeric timestamp
        updatedAt: 1672574400000, // Numeric timestamp
      });

      const responseDto = FamilyResponseDto.fromEntity(family);

      expect(responseDto.createdAt).toBe('2023-01-01T00:00:00.000Z');
      expect(responseDto.updatedAt).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should handle families with special characters in name', () => {
      const family = createMockFamily({
        id: 'test-uuid',
        name: 'Família & Co. Ltd. 🏠',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const responseDto = FamilyResponseDto.fromEntity(family);

      expect(responseDto.name).toBe('Família & Co. Ltd. 🏠');
      expect(responseDto.name).toContain('Família');
      expect(responseDto.name).toContain('🏠');
    });
  });
});
