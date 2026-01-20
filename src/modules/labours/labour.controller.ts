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

@Controller("/labour")
export class LabourController {
  constructor(private readonly labourService: LabourService) {}

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
@Post("scan")
scan(@Req() req, @Body("qr") qr: string) {
  return this.labourService.scan(req.user.worker_id, qr)
}


}
