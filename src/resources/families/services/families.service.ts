import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IFamiliesService } from '../interfaces/families-service.interface';
import { IFamiliesRepository } from '../interfaces/families-repository.interface';
import { PaginateQuery, Paginated } from 'nestjs-paginate';
import { UpsertFamilyDto, QueryParamsFamilyDto } from '../dto/family.dto';
import { Family } from '../entities/family.entity';

@Injectable()
export class FamiliesService implements IFamiliesService {
  constructor(
    @Inject('IFamiliesRepository')
    private readonly familiesRepository: IFamiliesRepository,
  ) {}

  async createFamily(dto: UpsertFamilyDto): Promise<Family> {
    return this.familiesRepository.create(dto);
  }

  async getFamilies(query: PaginateQuery): Promise<Paginated<Family>> {
    return this.familiesRepository.findPaginated(query);
  }

  async getFamily(query: QueryParamsFamilyDto): Promise<Family> {
    const family = await this.familiesRepository.findOne(query);

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return family;
  }

  async updateFamily(id: string, dto: UpsertFamilyDto): Promise<Family> {
    return await this.familiesRepository.update(id, dto);
  }

  async deleteFamily(id: string): Promise<void> {
    // Check if family exists before deleting (without loading relations)
    const family = await this.familiesRepository.findOne({ id });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return this.familiesRepository.hardDelete(id);
  }
}
