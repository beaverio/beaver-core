import { Controller, Get, UseGuards } from "@nestjs/common";
import { JWTAuthGuard } from "src/auth/guards/jwt-auth.guard";

@UseGuards(JWTAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor() { }

  @Get()
  async getAccounts() {
    return [];
  }
}