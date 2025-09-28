import { Controller, Get, Patch, Param, Delete, UseGuards, Request, Query, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findByUser(@Query() paginationDto: PaginationDto, @Request() req) {
    return this.notificationsService.findByUser(req.user.id, paginationDto);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.notificationsService.findOne(id, req.user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Patch('mark-all-read')
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.notificationsService.remove(id, req.user.id);
  }
}
