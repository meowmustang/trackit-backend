import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Res,
  UnauthorizedException,
  Req,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { AuthService } from "./auth.service"
import { SignupDto } from "./dto/signup.dto"
import { LoginDto } from "./dto/login.dto"
import type { Response, Request } from "express"
import { JwtService } from "@nestjs/jwt"

@Controller("/labour/auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  // ======================
  // SIGNUP
  // ======================
  @Post("signup")
  @UseInterceptors(FileInterceptor("photo"))
  async signup(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SignupDto,
  ) {
    return this.authService.signup(body, file)
  }

  // ======================
  // LOGIN
  // ======================
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token, worker } =
      await this.authService.login(dto)

    // ✅ Correct cookie path
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/labour/auth/refresh",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })

    return {
      access_token,
      worker,
    }
  }

  // ======================
  // REFRESH TOKEN
  // ======================
  @Post("refresh")
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refresh_token
    if (!token) {
      throw new UnauthorizedException("No refresh token")
    }

    const payload = this.jwtService.verify(token, {
      secret: process.env.JWT_REFRESH_SECRET,
    })

    const access_token = this.jwtService.sign(
      {
        worker_id: payload.worker_id,
        vendor_id: payload.vendor_id,
        role: payload.role,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: "15m",
      },
    )

    return { access_token }
  }

  // ======================
  // LOGOUT
  // ======================
  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("refresh_token", {
      path: "/labour/auth/refresh",
    })
    return { success: true }
  }
}
