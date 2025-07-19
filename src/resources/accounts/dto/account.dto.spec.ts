import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  UpsertAccountDto,
  QueryParamsAccountDto,
  AccountResponseDto,
} from './account.dto';
import { Account } from '../entities/account.entity';

// Helper function to create mock Account with all required properties
const createMockAccount = (overrides: Partial<Account> = {}): Account => {
  const timestamp = Date.now();
  const baseAccount = {
    id: '1',
    name: 'Test Account',
    createdAt: timestamp,
    updatedAt: timestamp,
    setCreationTimestamps: jest.fn(),
    setUpdateTimestamp: jest.fn(),
    ...overrides,
  };

  // Add getter properties with proper typing
  Object.defineProperty(baseAccount, 'createdAtDate', {
    get: function (this: { createdAt: number }) {
      return new Date(this.createdAt);
    },
  });
  Object.defineProperty(baseAccount, 'updatedAtDate', {
    get: function (this: { updatedAt: number }) {
      return new Date(this.updatedAt);
    },
  });

  return baseAccount as Account;
};

describe('Account DTO Behavior Tests', () => {
  describe('UpsertAccountDto', () => {
    it('should validate correctly with valid data', async () => {
      const validData = {
        name: 'Valid Account Name',
      };
      const dto = plainToClass(UpsertAccountDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate correctly with empty data (all optional)', async () => {
      const emptyData = {};
      const dto = plainToClass(UpsertAccountDto, emptyData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid data types', async () => {
      const invalidData = { name: 123 }; // number instead of string
      const dto = plainToClass(UpsertAccountDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should exclude system fields for security', () => {
      const upsertDto = new UpsertAccountDto();
      expect('id' in upsertDto).toBe(false);
      expect('createdAt' in upsertDto).toBe(false);
      expect('updatedAt' in upsertDto).toBe(false);
    });
  });

  describe('QueryParamsAccountDto', () => {
    it('should validate correctly with id parameter', async () => {
      const validData = { id: '123e4567-e89b-12d3-a456-426614174000' }; // Valid UUID
      const dto = plainToClass(QueryParamsAccountDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate correctly with empty data (all optional)', async () => {
      const emptyData = {};
      const dto = plainToClass(QueryParamsAccountDto, emptyData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid UUID format', async () => {
      const invalidData = { id: 'not-a-uuid' };
      const dto = plainToClass(QueryParamsAccountDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('AccountResponseDto', () => {
    it('should transform entity correctly with all required fields', () => {
      const account = createMockAccount({
        id: 'test-uuid',
        name: 'Response Account',
        createdAt: new Date('2023-01-01T00:00:00Z').getTime(),
        updatedAt: new Date('2023-01-01T12:00:00Z').getTime(),
      });

      const responseDto = AccountResponseDto.fromEntity(account);

      expect(responseDto.id).toBe('test-uuid');
      expect(responseDto.name).toBe('Response Account');
      expect(responseDto.createdAt).toBe('2023-01-01T00:00:00.000Z');
      expect(responseDto.updatedAt).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should transform multiple entities correctly', () => {
      const accounts = [
        createMockAccount({
          id: '1',
          name: 'Account One',
          createdAt: new Date('2023-01-01T00:00:00Z').getTime(),
          updatedAt: new Date('2023-01-01T12:00:00Z').getTime(),
        }),
        createMockAccount({
          id: '2',
          name: 'Account Two',
          createdAt: new Date('2023-01-02T00:00:00Z').getTime(),
          updatedAt: new Date('2023-01-02T12:00:00Z').getTime(),
        }),
      ];

      const responseDtos = AccountResponseDto.fromEntities(accounts);

      expect(responseDtos).toHaveLength(2);
      expect(responseDtos[0].id).toBe('1');
      expect(responseDtos[0].name).toBe('Account One');
      expect(responseDtos[1].id).toBe('2');
      expect(responseDtos[1].name).toBe('Account Two');
      expect(responseDtos[0].createdAt).toBe('2023-01-01T00:00:00.000Z');
      expect(responseDtos[1].updatedAt).toBe('2023-01-02T12:00:00.000Z');
    });

    it('should handle string timestamps correctly', () => {
      const account = createMockAccount({
        id: 'test-uuid',
        name: 'String Timestamp Account',
        createdAt: '1672531200000' as any, // String timestamp
        updatedAt: '1672574400000' as any, // String timestamp
      });

      const responseDto = AccountResponseDto.fromEntity(account);

      expect(responseDto.createdAt).toBe('2023-01-01T00:00:00.000Z');
      expect(responseDto.updatedAt).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should handle numeric timestamps correctly', () => {
      const account = createMockAccount({
        id: 'test-uuid',
        name: 'Numeric Timestamp Account',
        createdAt: 1672531200000, // Numeric timestamp
        updatedAt: 1672574400000, // Numeric timestamp
      });

      const responseDto = AccountResponseDto.fromEntity(account);

      expect(responseDto.createdAt).toBe('2023-01-01T00:00:00.000Z');
      expect(responseDto.updatedAt).toBe('2023-01-01T12:00:00.000Z');
    });

    it('should handle accounts with special characters in name', () => {
      const account = createMockAccount({
        id: 'test-uuid',
        name: 'Société & Co. Ltd. 🏢',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const responseDto = AccountResponseDto.fromEntity(account);

      expect(responseDto.name).toBe('Société & Co. Ltd. 🏢');
      expect(responseDto.name).toContain('Société');
      expect(responseDto.name).toContain('🏢');
    });
  });
});
