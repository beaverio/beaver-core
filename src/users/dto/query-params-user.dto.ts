import { IsEmail, IsOptional, IsUUID } from "class-validator";

export class GetUsersQueryDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}