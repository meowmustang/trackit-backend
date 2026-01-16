import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PrismaModule } from '../../database/prisma.module';
import { AutoGateOutJob } from './auto-gateout.job';

@Module({
  imports: [PrismaModule],
  controllers: [EventsController],
  providers: [EventsService, AutoGateOutJob],
})
export class EventsModule {}
