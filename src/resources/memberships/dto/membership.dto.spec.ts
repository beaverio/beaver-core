import 'reflect-metadata';
import { validate } from 'class-validator';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
  QueryParamsMembershipDto,
} from './membership.dto';

describe('Membership DTOs', () => {
  describe('CreateMembershipDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new CreateMembershipDto();
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';
      dto.accountId = '123e4567-e89b-12d3-a456-426614174001';
      dto.permissions = ['account:read', 'account:write'];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid userId', async () => {
      const dto = new CreateMembershipDto();
      dto.userId = 'invalid-uuid';
      dto.accountId = '123e4567-e89b-12d3-a456-426614174001';
      dto.permissions = ['account:read'];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
    });

    it('should fail validation with invalid accountId', async () => {
      const dto = new CreateMembershipDto();
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';
      dto.accountId = 'invalid-uuid';
      dto.permissions = ['account:read'];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('accountId');
    });

    it('should fail validation with empty permissions array', async () => {
      const dto = new CreateMembershipDto();
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';
      dto.accountId = '123e4567-e89b-12d3-a456-426614174001';
      dto.permissions = [];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('permissions');
    });

    it('should fail validation with non-string permissions', async () => {
      const dto = new CreateMembershipDto();
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';
      dto.accountId = '123e4567-e89b-12d3-a456-426614174001';
      dto.permissions = [123 as any, 'account:read'];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('permissions');
    });
  });

  describe('UpdateMembershipDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = new UpdateMembershipDto();
      dto.permissions = ['account:read', 'transaction:read'];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty permissions array', async () => {
      const dto = new UpdateMembershipDto();
      dto.permissions = [];

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('permissions');
    });
  });

  describe('QueryParamsMembershipDto', () => {
    it('should pass validation with valid UUID id', async () => {
      const dto = new QueryParamsMembershipDto();
      dto.id = '123e4567-e89b-12d3-a456-426614174000';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid UUID userId', async () => {
      const dto = new QueryParamsMembershipDto();
      dto.userId = '123e4567-e89b-12d3-a456-426614174000';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid UUID accountId', async () => {
      const dto = new QueryParamsMembershipDto();
      dto.accountId = '123e4567-e89b-12d3-a456-426614174000';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with all fields undefined', async () => {
      const dto = new QueryParamsMembershipDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid UUID id', async () => {
      const dto = new QueryParamsMembershipDto();
      dto.id = 'invalid-uuid';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('id');
    });
  });
});
