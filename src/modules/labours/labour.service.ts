import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../../database/prisma.service"
import { ro } from "date-fns/locale"

const now = new Date()

const todayStart = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
)

const todayEnd = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
)

@Injectable()
export class LabourService {
  constructor(private prisma: PrismaService) {}

  async getMe(workerId: string) {
  const worker = await this.prisma.workers.findUnique({
    where: { worker_id: workerId },
    include: {
      vendor: {
        select: {
          vendor_name: true,
        },
      },
    },
  })

  if (!worker) {
    throw new NotFoundException("Worker not found")
  }

  return {
    worker_id: worker.worker_id,
    worker_name: worker.worker_name,
    phone_number: worker.phone_number,
    vendor_name: worker.vendor.vendor_name,
    photo_url: worker.photo_url,
  }
}

async getTodayActivity(workerId: string) {
  const now = new Date()

  // Asia/Kolkata timezone handling
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const sessions = await this.prisma.fact_worker_sessions.findMany({
    where: {
      worker_id: workerId,
      work_date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    orderBy: {
      check_in_time: "asc",
    },
    select: {
      room_number: true,
      floor: true,
      check_in_time: true,
      check_out_time: true,
    },
  })

  return {
    activities: sessions.map(s => ({
      room_number: s.room_number,
      floor: s.floor,
      check_in_time: s.check_in_time
        ? s.check_in_time.toISOString()
        : null,
      check_out_time: s.check_out_time
        ? s.check_out_time.toISOString()
        : null,
    })),
  }
}


async scan(workerId: string, qr: string) {
  let payload: any

  try {
    payload = JSON.parse(qr)
  } catch {
    throw new BadRequestException("QR must be valid JSON")
  }

  if (!payload.room_id) {
    throw new BadRequestException("room_id missing in QR")
  }

  const room = await this.prisma.rooms.findUnique({
    where: { room_id: payload.room_id },
    select: {
      room_id: true,
      room_number: true,
      floor: true,
      place_type: true,
    },
  })

  if (!room) {
    throw new BadRequestException("Invalid QR: room not found")
  }

  // ✅ ONLY RETURN DATA — NO SIDE EFFECTS
  return {
    type: room.place_type, // "gate" | "room"
    room_id: room.room_id,
    room_number: room.room_number,
    floor: room.floor,
  }
}
}