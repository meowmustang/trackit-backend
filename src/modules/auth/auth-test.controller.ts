import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('labour')
export class AuthTestController {
  @UseGuards(JwtAuthGuard)
  @Get('protected-test')
  protectedTest(@Req() req: any) {
    return {
      message: 'Access granted',
      worker: req.user,
    };
  }
}
