import { Module } from '@nestjs/common';
import { ReportsController } from './presentation/reports/controllers/reports.controller';
import { ProfessionalEarningsService } from './application/reports/services/professional-earnings.service';

@Module({
  controllers: [ReportsController],
  providers: [ProfessionalEarningsService],
})
export class ReportsModule {}
