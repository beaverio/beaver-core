import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { AccountsController } from './accounts.controller';
import { Account } from './entities/account.entity';
import { AccountsRepository } from './repositories/accounts.repository';
import { AccountsService } from './services/accounts.service';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
    CommonModule,
    forwardRef(() => MembershipsModule),
  ],
  controllers: [AccountsController],
  providers: [
    {
      provide: 'IAccountsRepository',
      useClass: AccountsRepository,
    },
    {
      provide: 'IAccountsService',
      useClass: AccountsService,
    },
  ],
  exports: ['IAccountsRepository'],
})
export class AccountsModule {}
