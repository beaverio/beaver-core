import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { IUserRepository } from './interfaces/user.repository.interface';
import { IUserService } from './interfaces/user.service.interface';
export declare class UserService implements IUserService {
    private readonly userRepository;
    private users;
    constructor(userRepository: IUserRepository);
    createUser(dto: CreateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    findById(id: string): Promise<User | null>;
}
