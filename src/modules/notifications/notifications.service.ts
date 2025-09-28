import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity, NotificationType, NotificationStatus } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PaginationDto, PaginationResult } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(NotificationEntity)
        private notificationRepository: Repository<NotificationEntity>,
    ) { }

    async create(createNotificationDto: CreateNotificationDto): Promise<NotificationEntity> {
        const notification = this.notificationRepository.create(createNotificationDto);
        return this.notificationRepository.save(notification);
    }

    async findByUser(userId: string, paginationDto: PaginationDto): Promise<PaginationResult<NotificationEntity>> {
        const page = paginationDto.page || 1;
        const limit = paginationDto.limit || 10;
        const skip = (page - 1) * limit;

        const [data, total] = await this.notificationRepository.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }

    async findOne(id: string, userId?: string): Promise<NotificationEntity> {
        const whereCondition: any = { id };
        if (userId) {
            whereCondition.userId = userId;
        }

        const notification = await this.notificationRepository.findOne({
            where: whereCondition,
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        return notification;
    }

    async markAsRead(id: string, userId?: string): Promise<NotificationEntity> {
        const notification = await this.findOne(id, userId);
        notification.status = NotificationStatus.READ;
        return this.notificationRepository.save(notification);
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationRepository.update(
            { userId, status: NotificationStatus.UNREAD },
            { status: NotificationStatus.READ }
        );
    }

    async getUnreadCount(userId: string): Promise<{ count: number }> {
        const count = await this.notificationRepository.count({
            where: { userId, status: NotificationStatus.UNREAD }
        });
        return { count };
    }

    async remove(id: string, userId?: string): Promise<void> {
        const notification = await this.findOne(id, userId);
        await this.notificationRepository.remove(notification);
    }

    async createLoanNotification(userId: string, loanId: string, fullName: string): Promise<NotificationEntity> {
        return this.create({
            userId,
            type: NotificationType.LOAN_CREATED,
            title: 'Đơn vay đã được tạo',
            message: `Đơn vay của bạn (${fullName}) đã được gửi thành công. Chúng tôi sẽ xem xét và phản hồi sớm nhất.`,
            referenceId: loanId,
            metadata: { fullName }
        });
    }

    async createLoanApprovedNotification(userId: string, loanId: string, loanAmount: number, contractCode: string): Promise<NotificationEntity> {
        console.log('=== createLoanApprovedNotification called ===');
        console.log('Parameters:', { userId, loanId, loanAmount, contractCode });

        try {
            const notificationData = {
                userId,
                type: NotificationType.LOAN_APPROVED,
                title: 'Đơn vay được phê duyệt',
                message: `Chúc mừng! Đơn vay ${loanAmount.toLocaleString('vi-VN')} VND của bạn đã được phê duyệt. Mã hợp đồng: ${contractCode}. Số tiền đã được chuyển vào ví của bạn.`,
                referenceId: loanId,
                metadata: { loanAmount, contractCode }
            };

            console.log('Notification data:', notificationData);

            const result = await this.create(notificationData);
            console.log('Notification created:', result);

            return result;
        } catch (error) {
            console.error('Error in createLoanApprovedNotification:', error);
            throw error;
        }
    }

    async createLoanRejectedNotification(userId: string, loanId: string, fullName: string): Promise<NotificationEntity> {
        return this.create({
            userId,
            type: NotificationType.LOAN_REJECTED,
            title: 'Đơn vay bị từ chối',
            message: `Rất tiếc, đơn vay của bạn (${fullName}) không được phê duyệt. Vui lòng liên hệ bộ phận chăm sóc khách hàng để biết thêm chi tiết.`,
            referenceId: loanId,
            metadata: { fullName }
        });
    }

    async createLoanCompletedNotification(userId: string, loanId: string, contractCode: string): Promise<NotificationEntity> {
        return this.create({
            userId,
            type: NotificationType.LOAN_COMPLETED,
            title: 'Khoản vay đã tất toán',
            message: `Chúc mừng! Bạn đã hoàn thành thanh toán khoản vay mã hợp đồng ${contractCode}. Cảm ơn bạn đã tin tưởng sử dụng dịch vụ.`,
            referenceId: loanId,
            metadata: { contractCode }
        });
    }

    async createSystemNotification(userId: string, title: string, message: string, metadata?: any): Promise<NotificationEntity> {
        return this.create({
            userId,
            type: NotificationType.SYSTEM,
            title,
            message,
            metadata
        });
    }
}