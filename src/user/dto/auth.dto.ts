import { Role } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  isEmail,
  IsNumber,
  IsPositive,
  isNumber,
  IsEmail,
  Matches,
  MinLength,
} from 'class-validator';

export class registerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  role: Role;
}

export class loginDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export interface userDecorator {
  name: string;
  id: number;
  iat: number;
  exp: number;
  role: Role;
}
