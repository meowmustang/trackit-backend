import { Injectable, UnauthorizedException } from "@nestjs/common"
import { PrismaService } from "../../database/prisma.service"
import { JwtService } from "@nestjs/jwt"
import { LoginDto } from "./dto/login.dto"
import { SignupDto } from "./dto/signup.dto"
import { supabase } from "./supabase.client"

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ======================
  // LOGIN
  // ======================
  async login(dto: LoginDto): Promise<{
    access_token: string
    refresh_token: string
    worker: any
  }> {
    const worker = await this.prisma.workers.findUnique({
      where: { phone_number: dto.phone_number },
    })

    if (!worker || !worker.is_active) {
      throw new UnauthorizedException("Worker not registered")
    }

    const payload = {
      worker_id: worker.worker_id,
      vendor_id: worker.vendor_id,
      role: worker.role,
    }

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m', // ✅ CHANGED
    })

    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '30d',
    })

    return {
      access_token,
      refresh_token,
      worker,
    }
  }

  // ======================
  // SIGNUP
  // ======================
  async signup(body: SignupDto, file: Express.Multer.File) {
    if (!file) {
      throw new Error("Photo is required")
    }

    const workerId = body.worker_id
    const filePath = `workers/${workerId}.jpg`

    const { error } = await supabase.storage
      .from("worker-photos")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      })

    if (error) {
      throw new Error("Failed to upload photo")
    }

    const photoUrl =
      `${process.env.SUPABASE_URL}/storage/v1/object/public/worker-photos/${filePath}`

    const worker = await this.prisma.workers.create({
      data: {
        worker_id: body.worker_id,
        worker_name: body.worker_name,
        phone_number: body.phone_number,
        vendor_id: Number(body.vendor_id),
        role: body.role, // ✅ dynamic role
        photo_url: photoUrl,
      },
    })

    const payload = {
      worker_id: worker.worker_id,
      vendor_id: worker.vendor_id,
      role: worker.role,
    }

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    })

    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '30d',
    })

    return {
      access_token,
      refresh_token,
      worker,
    }
  }
}
