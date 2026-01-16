import { Body, Controller, Post, Get, Req, UseGuards, BadRequestException } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { EventsService } from './events.service'

@Controller('/labour/events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

 @Post()
ingest(@Req() req: any, @Body() payload: any) {
  const workerId = req.user.worker_id
  const vendorId = req.user.vendor_id

  if (!workerId || !vendorId) {
    throw new BadRequestException("Invalid token context")
  }

  return this.eventsService.ingest(payload, {
    worker_id: workerId,
    vendor_id: vendorId,
  })
}

  @Get('state')
  getCurrentState(@Req() req: any) {
    const workerId = req.user?.worker_id
    if (!workerId) {
      throw new BadRequestException('Invalid token')
    }
    return this.eventsService.getCurrentState(workerId)
  }
}
