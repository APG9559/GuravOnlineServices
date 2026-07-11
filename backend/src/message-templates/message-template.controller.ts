import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessageTemplateService } from './message-template.service';
import { CreateMessageTemplateDto, UpdateMessageTemplateDto } from './message-template.dto';

@Controller('message-templates')
@UseGuards(AuthGuard('jwt'))
export class MessageTemplateController {
  constructor(private readonly service: MessageTemplateService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMessageTemplateDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMessageTemplateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
