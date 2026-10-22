import { IsOptional, IsString, IsDateString } from 'class-validator';

export class ProfessionalEarningsQueryDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  medicoId?: string;
}
