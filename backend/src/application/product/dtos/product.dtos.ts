import { IsString, IsNumber, IsInt, IsBoolean, Min, IsUUID, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateProductDto {
  @IsString()
  codigo: string;

  @IsString()
  nombre: string;

  @IsString()
  categoria: string;

  @IsString()
  descripcion: string;

  @IsNumber()
  @Min(0)
  costoCompra: number;

  @IsNumber()
  @Min(0)
  precioVenta: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  stockActual: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  stockMinimo: number;

  @IsBoolean()
  activo: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsUUID()
  @IsOptional()
  id?: string;
}

export class ProductResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  codigo: string;

  @IsString()
  nombre: string;

  @IsString()
  categoria: string;

  @IsString()
  descripcion: string;

  @IsNumber()
  costoCompra: number;

  @IsNumber()
  precioVenta: number;

  @IsInt()
  stockActual: number;

  @IsInt()
  stockMinimo: number;

  @IsBoolean()
  activo: boolean;
}
