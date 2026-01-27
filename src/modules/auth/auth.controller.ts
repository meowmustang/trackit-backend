import { Controller, Post, Body, UploadedFile, UseInterceptors, Res, UnauthorizedException, Req } from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { AuthService } from "./auth.service"
import { SignupDto } from "./dto/signup.dto"
import { LoginDto } from "./dto/login.dto"
import type { Response, Request } from "express"
import { JwtService } from "@nestjs/jwt"
import { access } from "node:fs"



@Controller("/labour/auth")
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly jwtService: JwtService) {}

  // ✅ SIGNUP (multipart/form-data)
  @Post("signup")
  @UseInterceptors(FileInterceptor("photo"))
  async signup(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SignupDto
  ) {
    return this.authService.signup(body, file)
  }

  // ✅ LOGIN (JSON)
 @Post('login')
async login(
  @Body() dto: LoginDto,
  @Res({ passthrough: true }) res: Response,
) {
  const { accessToken, refreshToken } =
    await this.authService.login(dto)

  res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/', // ✅ IMPORTANT
});


  return { accessToken }
}


 @Post('refresh')
async refresh(
  @Req() req: any,
  @Res({ passthrough: true }) res: Response,
) {
  const token = req.cookies?.refresh_token
  if (!token) throw new UnauthorizedException('No refresh token')

  const payload = this.jwtService.verify(token, {
    secret: process.env.JWT_REFRESH_SECRET,
  })

  const accessToken = this.jwtService.sign(
    {
      worker_id: payload.worker_id,
      vendor_id: payload.vendor_id,
    },
    { expiresIn: '15m' },
  )

  return { accessToken }
}


  @Post('logout')
logout(@Res({ passthrough: true }) res: Response) {
  res.clearCookie('refresh_token', {
    path: '/',
  });
  return { success: true };
}



}
