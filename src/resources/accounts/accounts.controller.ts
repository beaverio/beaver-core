import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AccountResponseDto, UpsertAccountDto } from './dto/account.dto';
import { IAccountsService } from './interfaces/accounts-service.interface';
import { IMembershipsService } from '../memberships/interfaces/memberships-service.interface';
import { MembershipResponseDto } from '../memberships/dto/membership.dto';

@UseGuards(JWTAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(
    @Inject('IAccountsService')
    private readonly accountsService: IAccountsService,
    @Inject('IMembershipsService')
    private readonly membershipsService: IMembershipsService,
  ) {}

  @Post()
  async createAccount(
    @Body() dto: UpsertAccountDto,
  ): Promise<AccountResponseDto> {
    const account = await this.accountsService.createAccount(dto);
    return AccountResponseDto.fromEntity(account);
  }

  @Get()
  async getAccounts(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<AccountResponseDto>> {
    const result = await this.accountsService.getAccounts(query);
    const transformedData = AccountResponseDto.fromEntities(result.data);

    return {
      ...result,
      data: transformedData,
    } as Paginated<AccountResponseDto>;
  }

  @Get(':id')
  async getSelf(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<AccountResponseDto> {
    const account = await this.accountsService.getAccount({ id });
    return AccountResponseDto.fromEntity(account);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.accountsService.deleteAccount(id);
  }

  @Patch(':id')
  async updateAccount(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpsertAccountDto,
  ): Promise<AccountResponseDto> {
    const updatedUser = await this.accountsService.updateAccount(id, dto);
    return AccountResponseDto.fromEntity(updatedUser);
  }

  @Get(':accountId/memberships')
  async getAccountMemberships(
    @Param('accountId', new ParseUUIDPipe()) accountId: string,
  ): Promise<MembershipResponseDto[]> {
    return this.membershipsService.findFamilyMemberships(accountId);
  }
}
