import { IsString, IsNumber, IsArray, Min, IsOptional, ValidateNested, IsNotEmpty, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseDetailDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class CreatePurchaseDto {
  @IsString()
  @IsOptional()
  tipo?: string;

  @IsString()
  @IsOptional()
  pedidoId?: string;

  @IsString()
  @IsOptional()
  facturaNumero?: string;

  @IsString()
  @IsOptional()
  terceroId?: string;

  @IsOptional()
  @IsDateString()
  fechaCompra?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseDetailDto)
  details: PurchaseDetailDto[];
}

export class UpdatePurchaseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  terceroId?: string;

  @IsOptional()
  @IsDateString()
  fechaCompra?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseDetailDto)
  details?: PurchaseDetailDto[];
}
