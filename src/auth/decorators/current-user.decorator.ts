import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "src/users/entities/user.entity";

const getCurrentUser = (context: ExecutionContext): User => {
  const request = context.switchToHttp().getRequest();
  return request.user;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User =>
    getCurrentUser(context)
)