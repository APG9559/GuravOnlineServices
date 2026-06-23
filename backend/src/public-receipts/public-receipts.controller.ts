import { Controller, Get, Param, ForbiddenException } from '@nestjs/common';
import { PublicReceiptsService } from './public-receipts.service';

@Controller('public-receipts')
export class PublicReceiptsController {
  constructor(private readonly service: PublicReceiptsService) {}

  @Get()
  getSnoopyRoot() {
    throw new ForbiddenException("You shouldn't be so snoopy");
  }

  @Get(':type')
  getSnoopyType() {
    throw new ForbiddenException("You shouldn't be so snoopy");
  }

  @Get(':type/:id')
  async getReceipt(
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    return this.service.getReceipt(type, id);
  }
}
