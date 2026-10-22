import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ProfessionalEarningsService } from '../../../application/reports/services/professional-earnings.service';
import { ProfessionalEarningsQueryDto } from '../../../application/reports/dtos/professional-earnings.dtos';
import { Roles } from '../../../infrastructure/auth/decorators/roles.decorator';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly professionalEarningsService: ProfessionalEarningsService,
  ) {}

  @Get('professional-earnings')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMINISTRADOR', 'OPERADOR')
  async professionalEarnings(@Query() query: ProfessionalEarningsQueryDto) {
    return this.professionalEarningsService.getReport(query);
  }
}
