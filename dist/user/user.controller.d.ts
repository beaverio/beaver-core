import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { IUserService } from './interfaces/user.service.interface';
export declare class UserController {
    private readonly userService;
    constructor(userService: IUserService);
    findAll(): Promise<User[]>;
    create(createUserDto: CreateUserDto): Promise<User>;
}
