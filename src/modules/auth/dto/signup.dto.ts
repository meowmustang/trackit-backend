import { IsEnum, IsString, IsNumber, IsNotEmpty, Length, isString } from "class-validator";
import { Type } from "class-transformer";

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  worker_id: string;

  @IsString()
  @IsNotEmpty()
  worker_name: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  phone_number: string;

  @Type(() => Number)     // 👈 THIS is the key
  @IsNumber()
  vendor_id: number;

  @IsString()
  role: string;

}

