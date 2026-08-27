import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { DashboardService } from '../../../application/dashboard/services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getSummary(@Query('warehouseId') warehouseId?: string) {
    return this.dashboardService.getSummary(warehouseId);
  }
}
