import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateCccdDto {
  @IsOptional()
  @IsUrl({}, { message: 'URL ảnh mặt trước không hợp lệ' })
  frontImageUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL ảnh mặt sau không hợp lệ' })
  backImageUrl?: string;

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
  @IsString()
  currentAddress?: string;
}