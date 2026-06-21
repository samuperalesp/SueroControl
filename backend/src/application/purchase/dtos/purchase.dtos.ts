import { IsString, IsNumber, IsArray, Min, IsOptional, ValidateNested } from 'class-validator';
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseDetailDto)
  details: PurchaseDetailDto[];
}
