import { ICacheableRepository } from 'src/common/interfaces/cache-repository.interface';
import { IPaginatedRepository } from 'src/common/interfaces/paginated-repository.interface';
import { QueryParamsFamilyDto, UpsertFamilyDto } from '../dto/family.dto';
import { Family } from '../entities/family.entity';

export interface IFamiliesRepository
  extends ICacheableRepository<Family>,
    IPaginatedRepository<Family> {
  create(dto: UpsertFamilyDto): Promise<Family>;
  findOne(
    query: QueryParamsFamilyDto,
    relations?: string[],
  ): Promise<Family | null>;
  update(id: string, dto: UpsertFamilyDto): Promise<Family>;
  hardDelete(id: string): Promise<void>;
}
