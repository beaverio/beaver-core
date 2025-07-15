import { Response } from 'express';
import { User } from 'src/users/entities/user.entity';

export interface IAuthService {
  verifyUser(email: string, password: string): Promise<User>;
  verifyRefreshToken(refreshToken: string, userId: string): Promise<User>;
  login(user: User, response: Response): Promise<void>;
}
