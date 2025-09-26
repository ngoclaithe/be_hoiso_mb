import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { CccdService } from './cccd.service';
import { CreateCccdDto } from './dto/create-cccd.dto';
import { UpdateCccdDto } from './dto/update-cccd.dto';
import { SearchCccdDto } from './dto/search-cccd.dto';

@Controller('cccd')
export class CccdController {
  constructor(private readonly cccdService: CccdService) {}

  @Post()
  create(@Body(ValidationPipe) createCccdDto: CreateCccdDto) {
    return this.cccdService.create(createCccdDto);
  }

  @Get()
  findAll(@Query(ValidationPipe) searchDto: SearchCccdDto) {
    return this.cccdService.findAll(searchDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cccdService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateCccdDto: UpdateCccdDto,
  ) {
    return this.cccdService.update(id, updateCccdDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cccdService.remove(id);
  }
}