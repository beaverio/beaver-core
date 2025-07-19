import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { UsersModule } from '../users/users.module';
import { AccountsModule } from '../accounts/accounts.module';
import { Membership } from './entities/membership.entity';
import {
  MembershipsController,
  UserMembershipsController,
  AccountMembershipsController,
} from './memberships.controller';
import { MembershipsService } from './services/memberships.service';
import { MembershipsRepository } from './repositories/memberships.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Membership]),
    CommonModule,
    UsersModule,
    AccountsModule,
  ],
  controllers: [
    MembershipsController,
    UserMembershipsController,
    AccountMembershipsController,
  ],
  providers: [
    {
      provide: 'IMembershipsService',
      useClass: MembershipsService,
    },
    {
      provide: 'IMembershipsRepository',
      useClass: MembershipsRepository,
    },
  ],
  exports: ['IMembershipsService'],
})
export class MembershipsModule {}
