import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../../database/prisma.service'
import { EventsService } from './events.service'
import { EventAction } from './event-action.enum'

@Injectable()
export class AutoGateOutJob {
  private readonly logger = new Logger(AutoGateOutJob.name)

  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
  ) {}

  // Runs daily at 12:05 AM IST
  @Cron('5 0 * * *', { timeZone: 'Asia/Kolkata' })
  async autoGateOutWorkers() {
    this.logger.log('Running auto gate-out job')

    const stuckWorkers =
      await this.prisma.worker_current_state.findMany({
        where: {
          inside_building: true,
        },
      })

    for (const worker of stuckWorkers) {
      try {
        await this.eventsService.ingest(
          {
            client_event_id: `auto-gateout-${worker.worker_id}-${Date.now()}`,
            action: EventAction.GATE_OUT,
            event_time: new Date().toISOString(),
            system_generated: true,
          },
          {
            worker_id: worker.worker_id,
          } as any,
        )

        this.logger.log(
          `Auto gate-out done for worker ${worker.worker_id}`,
        )
      } catch (err) {
        this.logger.error(
          `Auto gate-out failed for worker ${worker.worker_id}`,
          err,
        )
      }
    }
  }
}
