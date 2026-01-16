import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';

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
}
