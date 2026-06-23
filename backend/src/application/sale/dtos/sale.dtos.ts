import { IsString, IsNumber, IsArray, Min, IsOptional, ValidateNested, IsIn, IsDateString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class SaleDetailDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  packageId?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateSaleDto {
  @IsString()
  @IsOptional()
  terceroId?: string;

  @IsString()
  medicoId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleDetailDto)
  details: SaleDetailDto[];
}

export class UpdateSaleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  terceroId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  medicoId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  estado?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleDetailDto)
  details?: SaleDetailDto[];
}

export class CancelSaleDto {
  @IsString()
  @IsNotEmpty()
  motivo: string;
}

export class SaleSearchDto {
  @IsOptional()
  @IsNumber()
  consecutivo?: number;

  @IsOptional()
  @IsString()
  terceroId?: string;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
