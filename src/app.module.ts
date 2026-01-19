import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { LabourModule } from './modules/labours/labour.module';
import { EventsModule } from './modules/events/events.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    AppController,
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    LabourModule,
    EventsModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
