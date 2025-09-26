import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('signature')
  generateSignature(
    @Body('folder') folder?: string,
    @Body('tags') tags?: string,
    @Body('transformation') transformation?: any,
  ) {
    return this.cloudinaryService.generateSignature(folder, tags, transformation);
  }

  @Post('optimized-urls')
  generateOptimizedUrls(@Body('public_id') publicId: string) {
    if (!publicId) throw new BadRequestException('public_id is required');
    return {
      public_id: publicId,
      urls: this.cloudinaryService.generateOptimizedUrls(publicId),
    };
  }
}
