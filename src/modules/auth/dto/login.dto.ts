import { IsString, Length } from "class-validator"

export class LoginDto {
  @IsString()
  @Length(10, 10)
  phone_number: string
}
