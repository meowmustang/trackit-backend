import { IsString, IsInt, IsEnum, IsOptional, IsISO8601 } from 'class-validator'
import { EventAction } from '../event-action.enum'

export class CreateEventDto {
  @IsOptional()
  @IsString()
  worker_id?: string;

  @IsOptional()
  @IsInt()
  vendor_id?: number;

  @IsString()
  room_id: string;

  @IsOptional()
  @IsString()
  room_no?: string;

  @IsOptional()
  @IsInt()
  floor_no?: number;

  @IsEnum(EventAction)
  action: EventAction;

  @IsISO8601()
  event_time: string;

  @IsOptional()
  @IsString()
  device_id?: string;
}
