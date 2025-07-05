import { createAccountSchema, createMembershipSchema } from './schema';

describe('accounts schema', () => {
  describe('createAccountSchema', () => {
    it('should validate a valid payload', () => {
      const data = { primaryUserId: 'b7e6e8e2-1c2d-4c3a-9b2a-1e2f3d4c5b6a' };
      expect(() => createAccountSchema.parse(data)).not.toThrow();
    });
    it('should fail if primaryUserId is missing', () => {
      expect(() => createAccountSchema.parse({})).toThrow();
    });
    it('should fail if primaryUserId is not a uuid', () => {
      expect(() => createAccountSchema.parse({ primaryUserId: 'not-a-uuid' })).toThrow();
    });
  });

  describe('createMembershipSchema', () => {
    it('should validate a valid payload', () => {
      const data = { userId: 'b7e6e8e2-1c2d-4c3a-9b2a-1e2f3d4c5b6a', roles: ["OWNER"] };
      expect(() => createMembershipSchema.parse(data)).not.toThrow();
    });
    it('should fail if userId is missing', () => {
      expect(() => createMembershipSchema.parse({ roles: ["OWNER"] })).toThrow();
    });
    it('should fail if roles is invalid', () => {
      expect(() => createMembershipSchema.parse({ userId: 'b7e6e8e2-1c2d-4c3a-9b2a-1e2f3d4c5b6a', roles: ["ADMIN"] })).toThrow();
    });
  });
});
