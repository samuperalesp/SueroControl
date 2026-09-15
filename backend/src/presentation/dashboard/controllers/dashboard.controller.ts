import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { DashboardService } from '../../../application/dashboard/services/dashboard.service';
import { DashboardQueryDto } from '../../../application/dashboard/dtos/dashboard.dtos';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getSummary(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getSummary(query);
  }
}
