import { Controller, Post, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, ResetPasswordDto } from './auth.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@CurrentUser('id') userId: string) {
    return this.authService.me(userId);
  }

  @Post('reset-password')
  @UseGuards(AuthGuard('jwt'))
  resetPassword(@CurrentUser('id') userId: string, @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(userId, dto.password);
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: { name?: string; signature?: string; avatar?: string }) {
    return this.authService.updateProfile(userId, dto.name, dto.signature, dto.avatar);
  }

  @Get('passkey/register-options')
  @UseGuards(AuthGuard('jwt'))
  getRegisterOptions(@CurrentUser('id') userId: string) {
    return this.authService.getRegisterOptions(userId);
  }

  @Post('passkey/register-verify')
  @UseGuards(AuthGuard('jwt'))
  verifyRegister(@Body() body: { sessionId: string; credential: any }) {
    return this.authService.verifyRegister(body.sessionId, body.credential);
  }

  @Get('passkey/login-options')
  getLoginOptions() {
    return this.authService.getLoginOptions();
  }

  @Post('passkey/login-verify')
  verifyLogin(@Body() body: { sessionId: string; credential: any }) {
    return this.authService.verifyLogin(body.sessionId, body.credential);
  }
}
