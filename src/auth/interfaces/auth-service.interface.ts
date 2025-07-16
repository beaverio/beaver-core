import { Response } from 'express';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entities/user.entity';

export interface IAuthService {
  signup(dto: CreateUserDto): Promise<User>;
  signin(user: User, response: Response): Promise<void>;
  verifyUser(email: string, password: string): Promise<User>;
  verifyRefreshToken(refreshToken: string, userId: string): Promise<User>;
}
