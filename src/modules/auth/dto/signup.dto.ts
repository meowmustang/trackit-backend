import { IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class SignupDto {
  @IsString()
  worker_id: string;

  @IsString()
  worker_name: string;

  @IsString()
  phone_number: string;

  @Type(() => Number)     // 👈 THIS is the key
  @IsNumber()
  vendor_id: number;
}
