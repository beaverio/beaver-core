import * as controller from './controller';
import httpMocks from 'node-mocks-http';

jest.mock('./service', () => ({
  __esModule: true,
  default: {
    createAccount: jest.fn().mockResolvedValue([{ id: 'acc-1', primaryUserId: 'user-1' }]),
    addMembership: jest.fn().mockResolvedValue(undefined),
    findMembershipByAccountAndUser: jest.fn(),
    removeMembership: jest.fn().mockResolvedValue(undefined),
    findAccountsOwnedByUser: jest.fn().mockResolvedValue([]),
    deleteAccount: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../users/service', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

const accountService = require('./service').default;
const userService = require('../users/service').default;

const fakeAccount = { id: 'acc-1', primaryUserId: 'user-1' };
const fakeUser = { id: 'user-2', email: 'a@b.com', name: 'Test' };

// createAccount
// addMember

describe('accounts controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAccount', () => {
    it('should create account and add membership', async () => {
      const req = httpMocks.createRequest({ body: { primaryUserId: 'user-1' } });
      const res = httpMocks.createResponse();
      await controller.createAccount(req, res);
      expect(accountService.createAccount).toHaveBeenCalledWith('user-1');
      expect(accountService.addMembership).toHaveBeenCalledWith('acc-1', 'user-1', ["OWNER", "READ", "WRITE"]);
      expect(res.statusCode).toBe(201);
      expect(res._getJSONData()).toEqual({ account: fakeAccount });
    });
  });

  describe('addMember', () => {
    it('should add a member if user exists and not already a member', async () => {
      userService.findById.mockResolvedValue(fakeUser);
      accountService.findMembershipByAccountAndUser.mockResolvedValue(undefined);
      const req = httpMocks.createRequest({ params: { accountId: 'acc-1' }, body: { userId: 'user-2', roles: ["READ"] } });
      const res = httpMocks.createResponse();
      await controller.addMember(req, res);
      expect(userService.findById).toHaveBeenCalledWith('user-2');
      expect(accountService.findMembershipByAccountAndUser).toHaveBeenCalledWith('acc-1', 'user-2');
      expect(accountService.addMembership).toHaveBeenCalledWith('acc-1', 'user-2', ["READ"]);
      expect(res.statusCode).toBe(201);
      expect(res._getJSONData()).toEqual({ message: 'User added with roles: READ' });
    });
    it('should return 404 if user does not exist', async () => {
      userService.findById.mockResolvedValue(undefined);
      const req = httpMocks.createRequest({ params: { accountId: 'acc-1' }, body: { userId: 'user-2', roles: ["READ"] } });
      const res = httpMocks.createResponse();
      await controller.addMember(req, res);
      expect(res.statusCode).toBe(404);
      expect(res._getJSONData()).toEqual({ error: 'User to add not found' });
    });
    it('should return 409 if user is already a member', async () => {
      userService.findById.mockResolvedValue(fakeUser);
      accountService.findMembershipByAccountAndUser.mockResolvedValue({ ...fakeUser, accountId: 'acc-1' });
      const req = httpMocks.createRequest({ params: { accountId: 'acc-1' }, body: { userId: 'user-2', roles: ["READ"] } });
      const res = httpMocks.createResponse();
      await controller.addMember(req, res);
      expect(res.statusCode).toBe(409);
      expect(res._getJSONData()).toEqual({ error: 'User is already a member of this account' });
    });
  });
});
