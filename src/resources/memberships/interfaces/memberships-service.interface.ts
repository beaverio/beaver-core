import {
  CreateMembershipDto,
  MembershipResponseDto,
  UpdateMembershipDto,
  UserMembershipsResponseDto,
} from '../dto/membership.dto';

export interface IMembershipsService {
  create(dto: CreateMembershipDto): Promise<MembershipResponseDto>;
  findOne(id: string): Promise<MembershipResponseDto>;
  update(id: string, dto: UpdateMembershipDto): Promise<MembershipResponseDto>;
  delete(id: string): Promise<void>;
  findUserMemberships(userId: string): Promise<UserMembershipsResponseDto>;
  findAccountMemberships(accountId: string): Promise<MembershipResponseDto[]>;
}
