import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  CreateUserDto,
  UpdateUserDto,
  QueryParamsUserDto,
  UserResponseDto,
} from './user.dto';
import { User } from '../entities/user.entity';

// Helper function to create mock User with all required properties
const createMockUser = (overrides: Partial<User> = {}): User => {
  const timestamp = Date.now();
  const baseUser = {
    id: '1',
    email: 'user1@example.com',
    password: 'pass1',
    createdAt: timestamp,
    updatedAt: timestamp,
    setCreationTimestamps: jest.fn(),
    setUpdateTimestamp: jest.fn(),
    ...overrides,
  };

  // Add getter properties with proper typing
  Object.defineProperty(baseUser, 'createdAtDate', {
    get: function (this: { createdAt: number }) {
      return new Date(this.createdAt);
    },
  });
  Object.defineProperty(baseUser, 'updatedAtDate', {
    get: function (this: { updatedAt: number }) {
      return new Date(this.updatedAt);
    },
  });

  return baseUser as User;
};

describe('DTO Behavior Tests', () => {
  describe('CreateUserDto', () => {
    it('should validate correctly with valid data', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
      };
      const dto = plainToClass(CreateUserDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid data', async () => {
      const invalidData = { email: 'invalid-email', password: 'weak' };
      const dto = plainToClass(CreateUserDto, invalidData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should sanitize email field', () => {
      const dataWithMaliciousEmail = {
        email: 'test<script>alert("xss")</script>@example.com',
        password: 'StrongPass123!',
      };
      const dto = plainToClass(CreateUserDto, dataWithMaliciousEmail);
      expect(dto.email).not.toContain('<script>');
      expect(dto.email).toContain('test');
      expect(dto.email).toContain('@example.com');
    });
  });

  describe('UpdateUserDto', () => {
    it('should validate correctly with partial valid data', async () => {
      const validData = { email: 'updated@example.com' };
      const dto = plainToClass(UpdateUserDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate correctly with empty data (all optional)', async () => {
      const emptyData = {};
      const dto = plainToClass(UpdateUserDto, emptyData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should sanitize email field in updates', () => {
      const dataWithMaliciousEmail = {
        email: 'updated<iframe src="javascript:alert(1)"></iframe>@example.com',
      };
      const dto = plainToClass(UpdateUserDto, dataWithMaliciousEmail);
      expect(dto.email).not.toContain('<iframe>');
      expect(dto.email).not.toContain('javascript:');
      expect(dto.email).toContain('updated');
      expect(dto.email).toContain('@example.com');
    });

    it('should handle email sanitization', () => {
      const dataWithMaliciousEmail = {
        email: 'test<script>alert(1)</script>@example.com',
      };
      const dto = plainToClass(UpdateUserDto, dataWithMaliciousEmail);
      expect(dto.email).not.toContain('<script>');
      expect(dto.email).toContain('test');
    });

    it('should not include refreshToken property for security', () => {
      const updateDto = new UpdateUserDto();
      expect('refreshToken' in updateDto).toBe(false);

      // Ensure UpdateUserDto doesn't inherit refreshToken validation
      // refreshToken should not be part of the DTO structure
      // Check if refreshToken property exists in the DTO class definition
      const descriptor = Object.getOwnPropertyDescriptor(
        UpdateUserDto.prototype,
        'refreshToken',
      );
      expect(descriptor).toBeUndefined();
    });
  });

  describe('QueryParamsUserDto', () => {
    it('should validate correctly with query parameters', async () => {
      const validData = { email: 'query@example.com' };
      const dto = plainToClass(QueryParamsUserDto, validData);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should sanitize query email parameter', () => {
      const dataWithMaliciousEmail = {
        email: 'query<script>alert("xss")</script>@example.com',
      };
      const dto = plainToClass(QueryParamsUserDto, dataWithMaliciousEmail);
      expect(dto.email).not.toContain('<script>');
      expect(dto.email).toContain('query');
      expect(dto.email).toContain('@example.com');
    });
  });

  describe('UserResponseDto', () => {
    it('should transform entity correctly without exposing sensitive fields', () => {
      const user = createMockUser({
        id: 'test-uuid',
        email: 'response@example.com',
        password: 'should-not-appear',
        createdAt: new Date('2023-01-01T00:00:00Z').getTime(),
        updatedAt: new Date('2023-01-01T12:00:00Z').getTime(),
      });

      const responseDto = UserResponseDto.fromEntity(user);

      expect(responseDto.id).toBe('test-uuid');
      expect(responseDto.email).toBe('response@example.com');
      expect(responseDto.createdAt).toBe('2023-01-01T00:00:00.000Z');
      expect(responseDto.updatedAt).toBe('2023-01-01T12:00:00.000Z');
      expect('password' in responseDto).toBe(false);
      expect('refreshToken' in responseDto).toBe(false);
    });

    it('should transform multiple entities correctly', () => {
      const users = [
        createMockUser({
          id: '1',
          email: 'user1@example.com',
          password: 'pass1',
          createdAt: new Date('2023-01-01T00:00:00Z').getTime(),
          updatedAt: new Date('2023-01-01T12:00:00Z').getTime(),
        }),
        createMockUser({
          id: '2',
          email: 'user2@example.com',
          password: 'pass2',
          createdAt: new Date('2023-01-02T00:00:00Z').getTime(),
          updatedAt: new Date('2023-01-02T12:00:00Z').getTime(),
        }),
      ];

      const responseDtos = UserResponseDto.fromEntities(users);

      expect(responseDtos).toHaveLength(2);
      expect(responseDtos[0].id).toBe('1');
      expect(responseDtos[1].email).toBe('user2@example.com');
      expect(responseDtos[0].createdAt).toBe('2023-01-01T00:00:00.000Z');
      expect(responseDtos[1].updatedAt).toBe('2023-01-02T12:00:00.000Z');
    });
  });

  describe('Sanitization Integration Tests', () => {
    it('should handle the example from the issue requirements', () => {
      const maliciousInput = {
        email: "test<script>alert('xss')</script>@example.com",
      };
      const dto = plainToClass(UpdateUserDto, maliciousInput);

      // Should match the expected output from the issue
      expect(dto.email).toBe(
        "test&lt;script&gt;alert('xss')&lt;/script&gt;@example.com",
      );
      expect(dto.email).not.toContain('<script>');
    });

    it('should preserve emojis as required', () => {
      const inputWithEmojis = {
        email: 'hello👋@example.com',
      };
      const dto = plainToClass(UpdateUserDto, inputWithEmojis);

      expect(dto.email).toBe(inputWithEmojis.email);
      expect(dto.email).toContain('👋');
    });

    it('should handle edge cases correctly', () => {
      const edgeCases = [
        { input: '', expected: '' },
        { input: '   ', expected: '   ' },
        { input: null, expected: null },
        { input: undefined, expected: undefined },
      ];

      edgeCases.forEach(({ input, expected }) => {
        const dto = plainToClass(UpdateUserDto, { email: input });
        expect(dto.email).toBe(expected);
      });
    });

    it('should handle unicode characters correctly', () => {
      const unicodeInput = {
        email: 'αβγ@example.com',
      };
      const dto = plainToClass(UpdateUserDto, unicodeInput);

      expect(dto.email).toBe(unicodeInput.email);
      expect(dto.email).toContain('αβγ');
    });
  });
});
