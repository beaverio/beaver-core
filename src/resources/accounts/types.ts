import { InferSelectModel } from "drizzle-orm"
import { AccountMembershipsTable, AccountsTable } from "./schema"

export type Account = InferSelectModel<typeof AccountsTable>
export type AccountMembership = InferSelectModel<typeof AccountMembershipsTable>
// No longer needed: AccountRole. Use string[] for roles.