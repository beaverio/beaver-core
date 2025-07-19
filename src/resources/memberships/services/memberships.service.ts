import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Paginated, PaginateQuery } from 'nestjs-paginate';
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
import { Membership } from '../entities/membership.entity';

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
    return this.mapToResponseDto(membership);
  }

  async findOne(id: string): Promise<MembershipResponseDto> {
    const membership = await this.membershipsRepository.findOne({ id });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }
    return this.mapToResponseDto(membership);
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
    return this.mapToResponseDto(updatedMembership);
  }

  async delete(id: string): Promise<void> {
    const membership = await this.membershipsRepository.findOne({ id });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    await this.membershipsRepository.hardDelete(id);
    this.logger.debug(`Membership deleted: ${id}`);
  }

  async findAll(
    pagination: PaginateQuery,
  ): Promise<Paginated<MembershipResponseDto>> {
    const paginatedResult =
      await this.membershipsRepository.findPaginated(pagination);

    return {
      ...paginatedResult,
      data: paginatedResult.data.map((membership: Membership) =>
        this.mapToResponseDto(membership),
      ),
    } as Paginated<MembershipResponseDto>;
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

    return memberships.map((membership) => this.mapToResponseDto(membership));
  }

  private mapToResponseDto(membership: Membership): MembershipResponseDto {
    return {
      id: membership.id,
      userId: membership.userId,
      accountId: membership.accountId,
      permissions: membership.permissions,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
      user: membership.user
        ? {
            id: membership.user.id,
            email: membership.user.email,
          }
        : undefined,
      account: membership.account
        ? {
            id: membership.account.id,
            name: membership.account.name,
          }
        : undefined,
    };
  }
}
