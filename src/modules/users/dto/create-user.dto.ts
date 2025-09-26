import { IsString, IsEmail, IsPhoneNumber, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone: string;
}