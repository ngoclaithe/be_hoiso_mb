import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class SearchCccdDto {
  @IsOptional()
  @IsString()
  cccd?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  hometown?: string;

  @IsOptional()
  @IsNumberString()
  page?: string = '1';

  @IsOptional()
  @IsNumberString()
  limit?: string = '10';
}