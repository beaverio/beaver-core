import { Injectable, Inject } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { IUserService } from './interfaces/user-service.interface';
import { IUserRepository } from './interfaces/user-repository.interface';
import { hash } from 'bcryptjs';

@Injectable()
export class UsersService implements IUserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) { }

  async createUser(dto: CreateUserDto): Promise<User> {
    return this.userRepository.create({
      ...dto,
      password: await hash(dto.password, 10),
    });
  }
}
