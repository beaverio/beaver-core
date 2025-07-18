import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { Paginated, PaginateQuery } from 'nestjs-paginate';
import {
  CreateUserDto,
  QueryParamsUserDto,
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

  async getUserById(id: string): Promise<User> {
    return this.getUser({ id });
  }

  // For user updates through the controller
  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const updateData = { ...dto };

    if (dto.password) {
      updateData.password = await hash(dto.password, 10);
    }

    return await this.userRepository.update(id, updateData);
  }

  async deleteUser(id: string): Promise<User> {
    // Check if user exists first
    await this.getUserById(id);

    return await this.userRepository.softDelete(id);
  }

  async updateLastLogin(id: string): Promise<User> {
    return await this.userRepository.updateLastLogin(id);
  }
}
