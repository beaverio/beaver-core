import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
export interface IUserService {
    createUser(dto: CreateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    findById(id: string): Promise<User | null>;
}
