import userService from "@src/resources/users/service";
import { NextFunction, Request, Response } from "express";

/**
 * Generic middleware to require a user to have a specific role (or be the owner) for a resource.
 * Pass in how to get the resourceId and how to check membership/ownership.
 */
export function requireRolesGeneric({
  getResourceId,
  getMembership,
  requiredRoles,
}: {
  getResourceId: (req: Request) => string | undefined,
  getMembership: (userId: string, resourceId: string) => Promise<{ roles: string[] } | null>,
  requiredRoles: string | string[],
}) {
  const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const auth0Id = req.auth?.sub;
      const resourceId = getResourceId(req);
      if (!auth0Id || !resourceId) {
        res.status(400).json({ error: "Missing resourceId or user authentication" });
        return;
      }
      const user = await userService.findByAuth0Id(auth0Id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const membership = await getMembership(user.id, resourceId);
      if (!membership || !required.every(r => membership.roles.includes(r))) {
        res.status(403).json({ error: `Requires permissions: ${required.join(", ")}` });
        return;
      }
      (req as any).membership = membership;
      next();
    } catch (err) {
      next(err);
    }
  };
}