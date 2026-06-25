import { IsString, IsNumber, IsOptional, Min, IsDateString, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePackageSessionDto {
  @IsString()
  @IsOptional()
  patientId?: string;

  @IsString()
  medicoId: string;

  @IsString()
  packageId: string;

  @IsNumber()
  @Min(1)
  cantidadSesiones: number;

  @IsNumber()
  @Min(0)
  descuentoPorcentaje: number;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;
}

export class ApplySessionDto {
  @IsOptional()
  @IsString()
  observaciones?: string;
}
