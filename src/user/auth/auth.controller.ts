import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto, registerDto } from '../dto/auth.dto';

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
}
