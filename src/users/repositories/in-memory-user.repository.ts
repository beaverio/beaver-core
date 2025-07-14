import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../interfaces/user.repository.interface';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];
  private idCounter = 1;

  async createUser(dto: CreateUserDto): Promise<User> {
    const user: User = {
      id: this.idCounter.toString(),
      name: dto.name,
      email: dto.email,
    };
    this.users.push(user);
    this.idCounter++;
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.users;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }
}
