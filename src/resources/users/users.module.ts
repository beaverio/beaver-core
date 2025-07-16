import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import { CachedUserRepository } from './repositories/cached-user.repository';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CommonModule],
  controllers: [UsersController],
  providers: [
    {
      provide: 'IUserService',
      useClass: UsersService,
    },
    {
      provide: 'IUserRepository',
      useClass: CachedUserRepository,
    },
  ],
  exports: ['IUserService'],
})
export class UsersModule {}
