import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsRepository } from './repositories/accounts.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), CommonModule],
  controllers: [AccountsController],
  providers: [{
    provide: 'IAccountsRepository',
    useClass: AccountsRepository,
  }],
})
export class AccountsModule { }
