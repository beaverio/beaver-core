import { Paginated, PaginateQuery } from 'nestjs-paginate';
import { QueryParamsFamilyDto, UpsertFamilyDto } from '../dto/family.dto';
import { Family } from '../entities/family.entity';

export interface IFamiliesService {
  createFamily(dto: UpsertFamilyDto): Promise<Family>;
  getFamilies(query: PaginateQuery): Promise<Paginated<Family>>;
  getFamily(query: QueryParamsFamilyDto): Promise<Family>;
  updateFamily(id: string, dto: UpsertFamilyDto): Promise<Family>;
  deleteFamily(id: string): Promise<void>;
}