import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import {
  CreateUserDto,
  GetUsersQueryDto,
  UpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { IUserService } from '../interfaces/user-service.interface';

@Injectable()
export class UsersService implements IUserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    return this.userRepository.create({
      ...dto,
      password: await hash(dto.password, 10),
    });
  }

  async getUsers(query: GetUsersQueryDto): Promise<User[]> {
    return await this.userRepository.findAll(query);
  }

  async getUser(query: GetUsersQueryDto): Promise<User> {
    const user = await this.userRepository.findOne(query);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const updateData = { ...dto };

    if (dto.password) {
      updateData.password = await hash(dto.password, 10);
    }

    if (dto.refreshToken) {
      updateData.refreshToken = await hash(dto.refreshToken, 10);
    }

    return await this.userRepository.update(id, updateData);
  }
}
