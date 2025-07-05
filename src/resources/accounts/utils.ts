import { requireRolesGeneric } from "@src/middleware/require-roles-generic";
import accountService from "@src/resources/accounts/service";

export function requireAccountRoles(requiredRoles: string | string[]) {
  return requireRolesGeneric({
    getResourceId: req => req.params.accountId,
    getMembership: async (userId, accountId) => {
      const membership = await accountService.findMembershipByAccountAndUser(accountId, userId);
      return membership ?? null;
    },
    requiredRoles,
  });
}