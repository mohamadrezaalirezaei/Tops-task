import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  loginDto,
  registerDto,
  updatePasswordDto,
  userDecorator,
} from '../dto/auth.dto';
import { User } from '../decorators/user.decorator';
import { Roles } from 'src/decorators/roles.decorators';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  register(@Body() body: registerDto) {
    return this.authService.register(body);
  }

  @Post('/login')
  async login(@Body() body: loginDto) {
    return this.authService.login(body);
  }

  @Roles(Role.ADMIN, Role.USER)
  @Get('/loggedInUser')
  async getLoggedInUser(@User() user: userDecorator) {
    return this.authService.getLoggedInUser(user);
  }

  @Roles(Role.ADMIN, Role.USER)
  @Put('updatePassword')
  async updatePassword(
    @Body() body: updatePasswordDto,
    @User() user: userDecorator,
  ) {
    return this.authService.updatePassword(body, user);
  }
}
