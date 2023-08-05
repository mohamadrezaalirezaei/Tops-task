import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { loginDto, userDecorator } from '../dto/auth.dto';

interface registerBody {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: Role;
}

interface loginBody {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async register({ name, email, password, phone, role }: registerBody) {
    const emailExist = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (emailExist) {
      throw new HttpException('Email already in use! ', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prismaService.user.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        role,
      },
    });

    const token = this.generateToken(name, user.id, user.role);

    return token;
  }

  async login({ email, password }: loginBody) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new HttpException('Email not found', HttpStatus.NOT_FOUND);
    }

    const truePassword = await bcrypt.compare(password, user.password);

    if (!truePassword) {
      throw new HttpException('Invalid credential', HttpStatus.BAD_REQUEST);
    }

    const token = await this.generateToken(user.name, user.id, user.role);
    return token;
  }

  async generateToken(name: string, id: number, role: Role) {
    const token = await jwt.sign({ name, id, role }, process.env.TOKEN_KEY, {
      expiresIn: 360000,
    });
    return token;
  }

  async getLoggedInUser(user: userDecorator) {
    const userInfo = this.prismaService.user.findUnique({
      where: {
        id: user.id,
      },
    });
    if (!userInfo) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return userInfo;
  }
}
