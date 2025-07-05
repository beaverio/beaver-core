import { db } from "@src/db";
import { UsersTable } from "@src/resources/users/schema";
import { eq } from "drizzle-orm";
import { CreateUserInput, UpdateUserInput, User } from "./types";

export function sanitize(user: User | undefined): Omit<User, 'auth0Id'> {
  if (!user) return undefined as any;
  const { auth0Id, ...rest } = user;
  return rest;
}

export default {
  findAll: () => db.query.users.findMany(),
  findById: (id: string) => db.query.users.findFirst({
    where: (user, { eq }) => eq(user.id, id),
    with: {
      memberships: {
        columns: {
          accountId: true,
          roles: true,
          joinedAt: true,
        },
      },
    },
  }),
  findByEmail: (email: string) => db.query.users.findFirst({
    where: (user, { eq }) => eq(user.email, email),
    with: {
      memberships: {
        columns: {
          accountId: true,
          roles: true,
          joinedAt: true,
        },
      },
    },
  }),
  findByAuth0Id: (auth0Id: string) => db.query.users.findFirst({ where: (user, { eq }) => eq(user.auth0Id, auth0Id) }),
  create: (data: CreateUserInput) => db.insert(UsersTable).values(data).returning(),
  update: (id: string, data: UpdateUserInput) => db.update(UsersTable).set(data).where(eq(UsersTable.id, id)).returning(),
  delete: (id: string) => db.delete(UsersTable).where(eq(UsersTable.id, id)).returning(),
}