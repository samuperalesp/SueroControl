import { Module } from '@nestjs/common';
import { DashboardController } from './presentation/dashboard/controllers/dashboard.controller';
import { DashboardService } from './application/dashboard/services/dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
