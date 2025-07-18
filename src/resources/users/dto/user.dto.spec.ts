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
});
