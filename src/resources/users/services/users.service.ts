import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { Paginated, PaginateQuery } from 'nestjs-paginate';
import {
  CreateUserDto,
  QueryParamsUserDto,
  UpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';
import { IUsersRepository } from '../interfaces/users-repository.interface';
import { IUserService } from '../interfaces/users-service.interface';

@Injectable()
export class UsersService implements IUserService {
  constructor(
    @Inject('IUsersRepository')
    private readonly userRepository: IUsersRepository,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    return this.userRepository.create({
      ...dto,
      password: await hash(dto.password, 10),
    });
  }

  async getUsers(query: PaginateQuery): Promise<Paginated<User>> {
    return await this.userRepository.findPaginated(query);
  }

  async getUser(query: QueryParamsUserDto): Promise<User> {
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

    return await this.userRepository.update(id, updateData);
  }

  async deleteUser(id: string): Promise<void> {
    await this.getUser({ id });

    await this.userRepository.hardDelete(id);
  }

  async updateLastLogin(id: string): Promise<User> {
    return await this.userRepository.updateLastLogin(id);
  }
}
