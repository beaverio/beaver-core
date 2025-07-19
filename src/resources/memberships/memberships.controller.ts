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
import { JWTAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CreateMembershipDto,
  MembershipResponseDto,
  UpdateMembershipDto,
} from './dto/membership.dto';
import { IMembershipsService } from './interfaces/memberships-service.interface';

@Controller('memberships')
@UseGuards(JWTAuthGuard)
export class MembershipsController {
  constructor(
    @Inject('IMembershipsService')
    private readonly membershipsService: IMembershipsService,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createMembershipDto: CreateMembershipDto,
  ): Promise<MembershipResponseDto> {
    return this.membershipsService.create(createMembershipDto);
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<MembershipResponseDto> {
    return this.membershipsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateMembershipDto: UpdateMembershipDto,
  ): Promise<MembershipResponseDto> {
    return this.membershipsService.update(id, updateMembershipDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.membershipsService.delete(id);
  }
}
