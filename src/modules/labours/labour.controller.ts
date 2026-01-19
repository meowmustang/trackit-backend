import { worker_current_state } from './../../../node_modules/.prisma/client/index.d';
import {
  Controller,
  Get,
  Post,
  Req,
  Body,
  UseGuards,
} from "@nestjs/common"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"
import { LabourService } from "./labour.service"
import { PrismaService } from "../../database/prisma.service"

@Controller("/labour")
export class LabourController {
  constructor(
    private readonly labourService: LabourService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@Req() req) {
    return this.labourService.getMe(req.user.worker_id)
  }

  @UseGuards(JwtAuthGuard)
  @Get("activity/today")
  getTodayActivity(@Req() req) {
  return this.labourService.getTodayActivity(req.user.worker_id)
}

@UseGuards(JwtAuthGuard)
@Get("worker/current-state")
async getCurrentState(@Req() req) {
  const workerId = req.user.worker_id;
  
  const state = await this.prisma.worker_current_state.findUnique({
    where: { worker_id: workerId },
    select: {
      inside_building: true,
      active_room_id: true,
    }
  });
  return{
    inside_building: state?.inside_building ?? false,
    active_room_id: state?.active_room_id ?? null,
  }
}

@UseGuards(JwtAuthGuard)
@Post("scan")
scan(@Req() req, @Body("qr") qr: string) {
  return this.labourService.scan(req.user.worker_id, qr)
}


}
