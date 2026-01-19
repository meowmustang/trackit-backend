import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { timestamp } from 'rxjs';

@Controller()
export class AppController {
  @UseGuards(JwtAuthGuard)
  @Get('/protected-test')
  getProtected(@Req() req: any) {
    return {
      message: 'You are authenticated',
      user: req.user,
    };
  }
  @Get('/health')
  health() {
    return { status: 'OK' , service: 'trackit-backend', timestamp: Date.now() };
  }
}
