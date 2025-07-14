import { Module } from '@nestjs/common';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [
    {
      provide: 'IUserService',
      useClass: UserService,
    },
    {
      provide: 'IUserRepository',
      useClass: InMemoryUserRepository,
    },
  ],
})
export class UserModule { }
