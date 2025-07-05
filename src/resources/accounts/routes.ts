import { validateBody } from "@src/middleware/validate-body";
import { asyncHandler } from "@utils/async-handler";
import { Router } from "express";
import { addMember, createAccount, deleteAccount } from "./controller";
import { createAccountSchema, createMembershipSchema } from "./schema";
import { requireAccountRoles } from "./utils"

const router = Router();

router.post("/", validateBody(createAccountSchema), asyncHandler(createAccount));
router.delete("/:accountId", requireAccountRoles(["OWNER"]), asyncHandler(deleteAccount));
router.post("/:accountId/members", requireAccountRoles(["OWNER"]), validateBody(createMembershipSchema), asyncHandler(addMember));

export default router;
