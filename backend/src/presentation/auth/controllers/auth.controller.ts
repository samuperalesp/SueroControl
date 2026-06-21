import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../../../application/auth/services/auth.service';
import { LoginDto } from '../../../application/auth/dtos/auth.dtos';
import { Public } from '../../../infrastructure/auth/guards/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('init')
  @HttpCode(HttpStatus.OK)
  async init() {
    return { initialized: true };
  }
}
