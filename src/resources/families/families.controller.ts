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
import { FamilyResponseDto, UpsertFamilyDto } from './dto/family.dto';
import { IFamiliesService } from './interfaces/families-service.interface';
import { IMembershipsService } from '../memberships/interfaces/memberships-service.interface';
import { MembershipResponseDto } from '../memberships/dto/membership.dto';

@UseGuards(JWTAuthGuard)
@Controller('families')
export class FamiliesController {
  constructor(
    @Inject('IFamiliesService')
    private readonly familiesService: IFamiliesService,
    @Inject('IMembershipsService')
    private readonly membershipsService: IMembershipsService,
  ) {}

  @Post()
  async createFamily(@Body() dto: UpsertFamilyDto): Promise<FamilyResponseDto> {
    const family = await this.familiesService.createFamily(dto);
    return FamilyResponseDto.fromEntity(family);
  }

  @Get()
  async getFamilies(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<FamilyResponseDto>> {
    const result = await this.familiesService.getFamilies(query);
    const transformedData = FamilyResponseDto.fromEntities(result.data);

    return {
      ...result,
      data: transformedData,
    } as Paginated<FamilyResponseDto>;
  }

  @Get(':id')
  async getSelf(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<FamilyResponseDto> {
    const family = await this.familiesService.getFamily({ id });
    return FamilyResponseDto.fromEntity(family);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFamily(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.familiesService.deleteFamily(id);
  }

  @Patch(':id')
  async updateFamily(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpsertFamilyDto,
  ): Promise<FamilyResponseDto> {
    const updatedUser = await this.familiesService.updateFamily(id, dto);
    return FamilyResponseDto.fromEntity(updatedUser);
  }

  @Get(':familyId/memberships')
  async getFamilyMemberships(
    @Param('familyId', new ParseUUIDPipe()) familyId: string,
  ): Promise<MembershipResponseDto[]> {
    return this.membershipsService.findFamilyMemberships(familyId);
  }
}
