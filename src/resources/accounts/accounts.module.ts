import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { AccountsController } from './accounts.controller';
import { Account } from './entities/account.entity';
import { AccountsRepository } from './repositories/accounts.repository';
import { AccountsService } from './services/accounts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), CommonModule],
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
})
export class AccountsModule {}
