import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageTemplate } from './message-template.entity';
import { CreateMessageTemplateDto, UpdateMessageTemplateDto } from './message-template.dto';

@Injectable()
export class MessageTemplateService {
  constructor(
    @InjectRepository(MessageTemplate)
    private readonly repo: Repository<MessageTemplate>,
  ) {}

  async findAll(): Promise<MessageTemplate[]> {
    return this.repo.find({ order: { label: 'ASC' } });
  }

  async findOne(id: string): Promise<MessageTemplate> {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Message template with ID "${id}" not found`);
    }
    return template;
  }

  async create(dto: CreateMessageTemplateDto): Promise<MessageTemplate> {
    const template = this.repo.create(dto);
    return this.repo.save(template);
  }

  async update(id: string, dto: UpdateMessageTemplateDto): Promise<MessageTemplate> {
    const template = await this.findOne(id);
    
    if (dto.label !== undefined) template.label = dto.label;
    if (dto.modules !== undefined) template.modules = dto.modules;
    if (dto.body !== undefined) template.body = dto.body;

    return this.repo.save(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.repo.remove(template);
  }
}
