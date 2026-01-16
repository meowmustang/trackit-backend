import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { AuthTestController } from './auth-test.controller';


@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: Number(process.env.JWT_EXPIRY),
      },
    }),
  ],
  controllers: [AuthController, AuthTestController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
