import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessageLogService } from './message-log.service';
import { CreateMessageLogDto } from './message-log.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('message-logs')
@UseGuards(AuthGuard('jwt'))
export class MessageLogController {
  constructor(private readonly service: MessageLogService) {}

  @Post()
  create(@Body() dto: CreateMessageLogDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(
    @Query('module') module?: string,
    @Query('channel') channel?: string,
    @Query('phone') phone?: string,
    @Query('name') name?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAll({ module, channel, phone, name, from, to, page, limit });
  }
}
