import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IUsersRepository } from '../../users/interfaces/users-repository.interface';
import { IAccountsRepository } from '../../accounts/interfaces/accounts-repository.interface';
import {
  CreateMembershipDto,
  MembershipResponseDto,
  UpdateMembershipDto,
  UserMembershipsResponseDto,
  MembershipItemDto,
} from '../dto/membership.dto';
import { IMembershipsRepository } from '../interfaces/memberships-repository.interface';
import { IMembershipsService } from '../interfaces/memberships-service.interface';

@Injectable()
export class MembershipsService implements IMembershipsService {
  private readonly logger = new Logger(MembershipsService.name);

  constructor(
    @Inject('IMembershipsRepository')
    private readonly membershipsRepository: IMembershipsRepository,
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
    @Inject('IAccountsRepository')
    private readonly accountsRepository: IAccountsRepository,
  ) {}

  async create(dto: CreateMembershipDto): Promise<MembershipResponseDto> {
    // Validate that user exists
    const user = await this.usersRepository.findOne({ id: dto.userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Validate that account exists
    const account = await this.accountsRepository.findOne({
      id: dto.accountId,
    });
    if (!account) {
      throw new BadRequestException('Account not found');
    }

    // Check if membership already exists
    const existingMembership =
      await this.membershipsRepository.findByUserAndAccount(
        dto.userId,
        dto.accountId,
      );
    if (existingMembership) {
      throw new ConflictException(
        'Membership already exists for this user and account',
      );
    }

    const membership = await this.membershipsRepository.create(dto);
    return MembershipResponseDto.fromEntity(membership);
  }

  async findOne(id: string): Promise<MembershipResponseDto> {
    const membership = await this.membershipsRepository.findOne({ id });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }
    return MembershipResponseDto.fromEntity(membership);
  }

  async update(
    id: string,
    dto: UpdateMembershipDto,
  ): Promise<MembershipResponseDto> {
    const existingMembership = await this.membershipsRepository.findOne({ id });
    if (!existingMembership) {
      throw new NotFoundException('Membership not found');
    }

    const updatedMembership = await this.membershipsRepository.update(id, dto);
    return MembershipResponseDto.fromEntity(updatedMembership);
  }

  async delete(id: string): Promise<void> {
    const membership = await this.membershipsRepository.findOne({ id });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    await this.membershipsRepository.hardDelete(id);
    this.logger.debug(`Membership deleted: ${id}`);
  }

  async findUserMemberships(
    userId: string,
  ): Promise<UserMembershipsResponseDto> {
    // Validate that user exists
    const user = await this.usersRepository.findOne({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const memberships = await this.membershipsRepository.findByUserId(userId);

    const membershipItems: MembershipItemDto[] = memberships.map(
      (membership) => ({
        accountId: membership.accountId,
        permissions: membership.permissions,
      }),
    );

    return {
      memberships: membershipItems,
    };
  }

  async findAccountMemberships(
    accountId: string,
  ): Promise<MembershipResponseDto[]> {
    // Validate that account exists
    const account = await this.accountsRepository.findOne({ id: accountId });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const memberships =
      await this.membershipsRepository.findByAccountId(accountId);

    return MembershipResponseDto.fromEntities(memberships);
  }
}
