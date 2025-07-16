import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/resources/users/entities/user.entity';

interface AuthenticatedRequest {
  user: User;
}

const getCurrentUser = (context: ExecutionContext): User => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => getCurrentUser(context),
);
