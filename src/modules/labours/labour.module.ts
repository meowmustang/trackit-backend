import { Module } from "@nestjs/common"
import { LabourController } from "./labour.controller"
import { LabourService } from "./labour.service"
import { PrismaModule } from "../../database/prisma.module"
import { PrismaService } from "src/database/prisma.service"

@Module({
  imports: [PrismaModule],
  controllers: [LabourController],
  providers: [LabourService, PrismaService],
})
export class LabourModule {}
