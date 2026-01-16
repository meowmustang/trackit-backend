import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { EventAction } from './event-action.enum'
import { Prisma } from '@prisma/client'
import { ro } from 'date-fns/locale'

type DbClient = Prisma.TransactionClient

type Ctx = {
  worker_id: string
  vendor_id: number
}

type IngestEvent = {
  client_event_id: string
  worker_id: string
  vendor_id: number
  room_id: string
  room_no?: string | null
  floor_no?: number | null
  action: EventAction
  event_time: Date
  device_id?: string | null
  system_generated?: boolean
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  // ============================
  // INGEST
  // ============================
  async ingest(payload: any, ctx: Ctx) {

    const vendorId =
  ctx.vendor_id ??
  (
    await this.prisma.workers.findUnique({
      where: { worker_id: ctx.worker_id },
      select: { vendor_id: true },
    })
  )?.vendor_id

    const events = Array.isArray(payload) ? payload : [payload]
    let inserted = 0

    await this.prisma.$transaction(async (tx) => {
      for (const raw of events) {
        const expanded = await this.validateAndExpand(raw, ctx, tx)

        await tx.event_logs.createMany({
          data: expanded.map(e => ({
            ...e,
            room_id: e.room_id ?? null,
            room_no: e.room_no ?? null,
            floor_no: e.floor_no ?? null,
            device_id: e.device_id ?? null,
            system_generated: e.system_generated ?? false,
          })),
        })

          inserted += expanded.length
          await this.updateWorkerCurrentState(
            expanded[expanded.length - 1],
            tx,
          )
          await this.updateWorkerSessions(expanded, tx)
        }
      }
    
    )
    return { received: events.length, inserted }
  }

  // ============================
  // RULE ENGINE
  // ============================
  private async validateAndExpand(
    raw: any,
    ctx: Ctx,
    db: DbClient,
  ): Promise<IngestEvent[]> {
    const event = this.buildEvent(raw, ctx)

    const state = await db.worker_current_state.findUnique({
      where: { worker_id: ctx.worker_id },
    })

    const inside = state?.inside_building ?? false
    const activeRoom = state?.active_room_id ?? null

    const inserts: IngestEvent[] = []

    // ---------- GATE ----------
    if (event.action === EventAction.GATE_IN) {
      if (inside) throw new BadRequestException('Already inside building')
      inserts.push(event)
      return inserts
    }

    if (event.action === EventAction.GATE_OUT) {
      if (!inside) throw new BadRequestException('Not inside building')

      if (activeRoom) {
        inserts.push(
          this.buildEvent(
            {
              ...raw,
              client_event_id: `${event.client_event_id}::auto-checkout`,
              action: EventAction.CHECK_OUT,
              room_id: activeRoom,
              system_generated: true,
            },
            ctx,
          ),
        )
      }

      inserts.push(event)
      return inserts
    }

    // ---------- ROOM ----------
    if (event.action === EventAction.CHECK_IN) {
      if (!inside) throw new BadRequestException('Must gate_in first')

      if (!activeRoom) {
        inserts.push(event)
        return inserts
      }

      if (activeRoom === event.room_id) {
        throw new BadRequestException('Already checked into this room')
      }

      if (!raw.force) {
        throw new BadRequestException({
          code: 'CONFIRM_ROOM_SWITCH',
          current_room: activeRoom,
          next_room: event.room_id,
        })
      }

      // auto checkout previous room
      inserts.push(
        this.buildEvent(
          {
            ...raw,
            client_event_id: `${event.client_event_id}::auto-checkout`,
            action: EventAction.CHECK_OUT,
            room_id: activeRoom,
            system_generated: true, 
          },
          ctx,
        ),
      )

      inserts.push(event)
      return inserts
    }

    if (event.action === EventAction.CHECK_OUT) {
      if (!activeRoom) {
        throw new BadRequestException('No active room to check out from')
      }

      if (activeRoom !== event.room_id) {
        throw new BadRequestException('Room mismatch on checkout')
      }

      inserts.push(event)
      return inserts
    }

    throw new BadRequestException('Invalid action')
  }

  // ============================
  // CURRENT STATE UPDATE
  // ============================
  private async updateWorkerCurrentState(
    e: IngestEvent,
    db: DbClient,
  ) {
    let inside_building = true
    let active_room_id: string | null = null

    if (e.action === EventAction.GATE_OUT) {
      inside_building = false
      active_room_id = null
    }

    if (e.action === EventAction.CHECK_IN) {
      active_room_id = e.room_id!
    }

    if (e.action === EventAction.CHECK_OUT) {
      active_room_id = null
    }

    await db.worker_current_state.upsert({
      where: { worker_id: e.worker_id },
      update: {
        inside_building,
        active_room_id,
        last_action: e.action,
        last_event_time: e.event_time,
        updated_at: new Date(),
      },
      create: {
        worker_id: e.worker_id,
        inside_building,
        active_room_id,
        last_action: e.action,
        last_event_time: e.event_time,
      },
    })
  }

  // ============================
  // EVENT BUILDER
  // ============================
  private buildEvent(raw: any, ctx: Ctx): IngestEvent {
  const roomId =
    raw.room_id ??
    (raw.action === EventAction.GATE_IN ||
     raw.action === EventAction.GATE_OUT
      ? "MAIN-GATE"
      : null)

  if (!roomId) {
    throw new BadRequestException("room_id is required")
  }
    return {
      client_event_id: raw.client_event_id,
      worker_id: ctx.worker_id,
      vendor_id: ctx.vendor_id,
      room_id: roomId,
      room_no: raw.room_no ?? null,
      floor_no: raw.floor_no ?? null,
      action: raw.action,
      event_time: new Date(raw.event_time),
      device_id: raw.device_id ?? null,
      system_generated: raw.system_generated ?? false,
    }
  }

  // ============================
  // FAST STATE READ
  // ============================
  async getCurrentState(workerId: string) {
    return (
      (await this.prisma.worker_current_state.findUnique({
        where: { worker_id: workerId },
      })) ?? {
        worker_id: workerId,
        inside_building: false,
        active_room_id: null,
        last_action: null,
        last_event_time: null,
      }
    )
  }

  // =============================
// SESSION DERIVATION (FACT TABLE)
// ===============================
private async updateWorkerSessions(
  events: IngestEvent[],
  db: DbClient,
) {
  for (const e of events) {
    // ---------- CHECK-IN ----------
    if (e.action === EventAction.CHECK_IN) {
      await db.fact_worker_sessions.create({
        data: {
          worker_id: e.worker_id,
          vendor_id: e.vendor_id,
          room_id: e.room_id,
          room_number: e.room_no ?? null,
          floor: e.floor_no ?? null,
          work_date: new Date(e.event_time),
          check_in_time: e.event_time,
          check_out_time: null,
        },
      })
    }

    // ---------- CHECK-OUT ----------
    if (e.action === EventAction.CHECK_OUT) {
      const updated = await db.fact_worker_sessions.updateMany({
        where: {
          worker_id: e.worker_id,
          room_id: e.room_id,
          check_out_time: null,
        },
        data: {
          check_out_time: e.event_time,
        },
      })

      if (updated.count === 0 && !e.system_generated) {
        throw new BadRequestException(
          'No active session to check out from',
        )
      }
    }
  }
}
}
