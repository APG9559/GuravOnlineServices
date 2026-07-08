import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReferencesService } from './references.service';

@Controller('references')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReferencesController {
  constructor(private readonly service: ReferencesService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.findAll({ search, page, limit });
  }
}
