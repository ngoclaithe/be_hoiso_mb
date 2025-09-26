import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { CccdEntity } from './entities/cccd.entity';
import { CreateCccdDto } from './dto/create-cccd.dto';
import { UpdateCccdDto } from './dto/update-cccd.dto';
import { SearchCccdDto } from './dto/search-cccd.dto';

@Injectable()
export class CccdService {
  constructor(
    @InjectRepository(CccdEntity)
    private readonly cccdRepository: Repository<CccdEntity>,
  ) {}

  async create(createCccdDto: CreateCccdDto): Promise<CccdEntity> {
    const cccd = this.cccdRepository.create(createCccdDto);
    return await this.cccdRepository.save(cccd);
  }

  async findAll(searchDto: SearchCccdDto) {
    const { page = '1', limit = '10', cccd, name, hometown } = searchDto;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};
    if (cccd) where.cccd = Like(`%${cccd}%`);
    if (name) where.name = Like(`%${name}%`);
    if (hometown) where.hometown = Like(`%${hometown}%`);

    const findOptions: FindManyOptions<CccdEntity> = {
      where,
      skip,
      take,
      order: { createdAt: 'DESC' },
    };

    const [data, total] = await this.cccdRepository.findAndCount(findOptions);

    return {
      data,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async findOne(id: string): Promise<CccdEntity> {
    const cccd = await this.cccdRepository.findOne({ where: { id } });
    if (!cccd) {
      throw new NotFoundException(`CCCD với ID ${id} không tồn tại`);
    }
    return cccd;
  }

  async update(id: string, updateCccdDto: UpdateCccdDto): Promise<CccdEntity> {
    const cccd = await this.findOne(id);
    Object.assign(cccd, updateCccdDto);
    return await this.cccdRepository.save(cccd);
  }

  async remove(id: string): Promise<void> {
    const cccd = await this.findOne(id);
    await this.cccdRepository.remove(cccd);
  }
}