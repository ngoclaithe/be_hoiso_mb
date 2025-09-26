import { PartialType } from '@nestjs/mapped-types';
import { CreateCccdDto } from './create-cccd.dto';

export class UpdateCccdDto extends PartialType(CreateCccdDto) {}