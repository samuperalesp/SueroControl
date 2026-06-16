import { IsString, IsNumber, IsBoolean, Min, IsUUID, IsOptional } from 'class-validator';
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

  @IsNumber()
  @Min(0)
  stockActual: number;

  @IsNumber()
  @Min(0)
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

  @IsNumber()
  stockActual: number;

  @IsNumber()
  stockMinimo: number;

  @IsBoolean()
  activo: boolean;
}
