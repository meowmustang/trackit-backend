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

  async login(dto: LoginDto): Promise<{ access_token: string; worker: any; accessToken: string; refreshToken: string }> {
    const worker = await this.prisma.workers.findUnique({
      where: { phone_number: dto.phone_number },
    })

    if (!worker || !worker.is_active) {
      throw new UnauthorizedException("Worker not registered")
    }

      const payload = {
      worker_id: worker.worker_id,
      vendor_id: worker.vendor_id,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '30d',
    });

    return {
      access_token: this.generateToken(worker),
      worker,
      accessToken, refreshToken
    };

  }

  private generateToken(worker: any) {
    return this.jwtService.sign({
      worker_id: worker.worker_id,
      vendor_id: worker.vendor_id,
      role: "labour",
    })
  }

  async signup(body: SignupDto, file: Express.Multer.File) {
  if (!file) {
    throw new Error("Photo is required")
  }

  const workerId = body.worker_id
  const filePath = `workers/${workerId}.jpg`

  // 1️⃣ Upload to Supabase bucket
  const { error } = await supabase.storage
    .from("worker-photos")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    })

  if (error) {
    throw new Error("Failed to upload photo")
  }

  // 2️⃣ Public URL
  const photoUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/worker-photos/${filePath}`

  // 3️⃣ Save worker
  const worker = await this.prisma.workers.create({
    data: {
      worker_id: body.worker_id,
      worker_name: body.worker_name,
      phone_number: body.phone_number,
      vendor_id: Number(body.vendor_id),
      photo_url: photoUrl, // ✅ now valid
    },
  })

  return {
    access_token: this.generateToken(worker),
    worker,
  }
}
}
