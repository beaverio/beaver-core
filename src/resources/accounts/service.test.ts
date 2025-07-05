import accountService from './service';

jest.mock('@src/db', () => ({
  __esModule: true,
  db: {
    insert: jest.fn(),
    delete: jest.fn(),
    query: {
      account_memberships: {
        findFirst: jest.fn(),
      },
      accounts: {
        findMany: jest.fn(),
      },
    },
  },
}));

const { db } = require('@src/db');

describe('accountService', () => {
  const fakeAccount = { id: 'acc-1', primaryUserId: 'user-1' };
  const fakeMembership = { accountId: 'acc-1', userId: 'user-2', roles: ["READ"] };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAccount', () => {
    it('should insert a new account', async () => {
      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: () => [fakeAccount],
        }),
      });
      const result = await accountService.createAccount('user-1');
      expect(db.insert).toHaveBeenCalled();
      expect(result[0]).toEqual(fakeAccount);
    });
  });

  describe('addMembership', () => {
    it('should add a membership if not exists', async () => {
      db.query.account_memberships.findFirst.mockResolvedValue(undefined);
      db.insert.mockReturnValue({ values: jest.fn().mockResolvedValue([fakeMembership]) });
      const result = await accountService.addMembership('acc-1', 'user-2', ["READ"]);
      expect(db.query.account_memberships.findFirst).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
    it('should throw if membership exists', async () => {
      db.query.account_memberships.findFirst.mockResolvedValue(fakeMembership);
      await expect(accountService.addMembership('acc-1', 'user-2', ["READ"])).rejects.toThrow();
    });
  });

  describe('removeMembership', () => {
    it('should call db.delete', async () => {
      db.delete.mockReturnValue({ where: jest.fn() });
      await accountService.removeMembership('acc-1', 'user-2');
      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe('findAccountsOwnedByUser', () => {
    it('should query accounts by primaryUserId', async () => {
      db.query.accounts.findMany.mockResolvedValue([fakeAccount]);
      const result = await accountService.findAccountsOwnedByUser('user-1');
      expect(db.query.accounts.findMany).toHaveBeenCalled();
      expect(result[0]).toEqual(fakeAccount);
    });
  });

  describe('findMembershipByAccountAndUser', () => {
    it('should query membership by account and user', async () => {
      db.query.account_memberships.findFirst.mockResolvedValue(fakeMembership);
      const result = await accountService.findMembershipByAccountAndUser('acc-1', 'user-2');
      expect(db.query.account_memberships.findFirst).toHaveBeenCalled();
      expect(result).toEqual(fakeMembership);
    });
  });
});
