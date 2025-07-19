import { ICacheableRepository } from 'src/common/interfaces/cache-repository.interface';
import { IPaginatedRepository } from 'src/common/interfaces/paginated-repository.interface';
import {
  CreateMembershipDto,
  QueryParamsMembershipDto,
  UpdateMembershipDto,
} from '../dto/membership.dto';
import { Membership } from '../entities/membership.entity';

export interface IMembershipsRepository
  extends ICacheableRepository<Membership>,
    IPaginatedRepository<Membership> {
  create(dto: CreateMembershipDto): Promise<Membership>;
  findOne(query: QueryParamsMembershipDto): Promise<Membership | null>;
  update(id: string, dto: UpdateMembershipDto): Promise<Membership>;
  hardDelete(id: string): Promise<void>;
  findByUserId(userId: string): Promise<Membership[]>;
  findByAccountId(accountId: string): Promise<Membership[]>;
  findByUserAndAccount(
    userId: string,
    accountId: string,
  ): Promise<Membership | null>;
}
