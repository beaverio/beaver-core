import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../interfaces/user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) { }


  async createUser(dto: CreateUserDto): Promise<User> {
    const user = this.repo.create(dto);
    const saved = await this.repo.save(user);
    return saved;
  }

  async findAll(): Promise<User[]> {
    return await this.repo.find();
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }
}
