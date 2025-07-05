import { Request, Response } from "express";
import userService from "../users/service";
import accountService from "./service";

export async function createAccount(req: Request, res: Response) {
  const { primaryUserId } = req.body;
  const [account] = await accountService.createAccount(primaryUserId);
  await accountService.addMembership(account.id, primaryUserId, ["OWNER", "READ", "WRITE"]);
  res.status(201).json({ account });
}

export async function deleteAccount(req: Request, res: Response) {
  const { accountId } = req.params;
  await accountService.deleteAccount(accountId);
  res.status(204).send();
}

export async function addMember(req: Request, res: Response) {
  const { userId, roles } = req.body;
  const accountId = req.params.accountId;

  const userToAdd = await userService.findById(userId);
  if (!userToAdd) {
    res.status(404).json({ error: "User to add not found" });
    return;
  }

  const existing = await accountService.findMembershipByAccountAndUser(accountId, userId);
  if (existing) {
    res.status(409).json({ error: "User is already a member of this account" });
    return;
  }

  await accountService.addMembership(accountId, userId, roles);
  res.status(201).json({ message: `User added with roles: ${roles.join(", ")}` });
}
