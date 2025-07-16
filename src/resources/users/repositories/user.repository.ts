import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateUserDto,
  QueryParamsUserDto,
  UpdateUserDto,
} from '../dto/user.dto';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../interfaces/user-repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    return this.repo.save(dto);
  }

  async findAll(where: QueryParamsUserDto): Promise<User[]> {
    return this.repo.find({ where });
  }

  async findOne(where: QueryParamsUserDto): Promise<User | null> {
    return this.repo.findOne({ where });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });

    if (!user) {
      throw new Error('User not found');
    }

    this.repo.merge(user, dto);
    return await this.repo.save(user);
  }
}
