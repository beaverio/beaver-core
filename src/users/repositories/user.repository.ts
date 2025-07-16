import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { GetUsersQueryDto } from '../dto/query-params-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../interfaces/user-repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) { }

  async create(dto: CreateUserDto): Promise<User> {
    return this.repo.save(dto);
  }

  async findAll(where: GetUsersQueryDto): Promise<User[]> {
    return this.repo.find({ where })
  }

  async findOne(where: GetUsersQueryDto): Promise<User | null> {
    return this.repo.findOne({ where });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });

    if (!user) {
      throw new Error('User not found');
    }

    Object.assign(user, dto);
    return this.repo.save(user);
  }
}
