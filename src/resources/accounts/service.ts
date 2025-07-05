import { db } from "@src/db";
import { and, eq } from "drizzle-orm";
import { AccountMembershipsTable, AccountsTable } from "./schema";
import { AccountMembership } from "./types";

export default {
  deleteAccount: (accountId: string) =>
    db.delete(AccountsTable).where(eq(AccountsTable.id, accountId)),

  findMembershipByUserId: (userId: string) =>
    db.query.account_memberships.findMany({
      where: (membership, { eq }) => eq(membership.userId, userId),
    }),

  createAccount: (primaryUserId: string) =>
    db.insert(AccountsTable).values({
      primaryUserId,
      name: "Default Account",
    }).returning(),

  addMembership: async (accountId: string, userId: string, roles: string[]) => {
    const existing = await db.query.account_memberships.findFirst({
      where: (membership, { eq, and }) =>
        and(eq(membership.accountId, accountId), eq(membership.userId, userId)),
    });
    if (existing) {
      throw new Error("User is already a member of this account");
    }
    if (roles.includes("OWNER")) {
      // Check if any membership for this account already has OWNER in roles array
      const owner = await db.query.account_memberships.findFirst({
        where: (membership, { eq, and, sql }) =>
          and(
            eq(membership.accountId, accountId),
            sql`${membership.roles} @> ARRAY['OWNER']::varchar[]`
          ),
      });
      if (owner) {
        throw new Error("This account already has an owner");
      }
    }
    return db.insert(AccountMembershipsTable).values({
      accountId,
      userId,
      roles,
      joinedAt: new Date(),
    });
  },

  removeMembership: (accountId: string, userId: string) =>
    db.delete(AccountMembershipsTable)
      .where(and(eq(AccountMembershipsTable.accountId, accountId), eq(AccountMembershipsTable.userId, userId))),

  findAccountsOwnedByUser: (userId: string) =>
    db.query.accounts.findMany({
      where: (account, { eq }) => eq(account.primaryUserId, userId),
    }),

  findMembershipByAccountAndUser: (accountId: string, userId: string) =>
    db.query.account_memberships.findFirst({
      where: (membership, { eq, and }) => and(eq(membership.accountId, accountId), eq(membership.userId, userId)),
    }),
};
