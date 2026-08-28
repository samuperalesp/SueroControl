import { IsString, IsInt, IsBoolean, IsOptional, IsNotEmpty, IsDateString, Min, IsArray, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsBoolean()
  @IsOptional()
  esPrincipal?: boolean;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateWarehouseDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  nombre?: string;

  @IsBoolean()
  @IsOptional()
  esPrincipal?: boolean;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class TransferLineDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  cantidad: number;
}

export class TransferStockDto {
  @IsString()
  @IsNotEmpty()
  origenId: string;

  @IsString()
  @IsNotEmpty()
  destinoId: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsString()
  @IsOptional()
  observacion?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TransferLineDto)
  lineas: TransferLineDto[];
}
