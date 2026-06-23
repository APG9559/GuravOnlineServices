import { Controller, Get, Param } from '@nestjs/common';
import { PublicReceiptsService } from './public-receipts.service';

@Controller('public-receipts')
export class PublicReceiptsController {
  constructor(private readonly service: PublicReceiptsService) {}

  @Get(':type/:id')
  async getReceipt(
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    return this.service.getReceipt(type, id);
  }
}
