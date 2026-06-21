import { IsString, IsNumber, IsBoolean, IsArray, Min, Max, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PackageDetailDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class PackageOperatingCostDto {
  @IsString()
  concepto: string;

  @IsNumber()
  @Min(0)
  valor: number;
}

export class CreatePackageDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @Min(0)
  precio: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  porcentajeMedico?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  porcentajeCentro?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageDetailDto)
  details: PackageDetailDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PackageOperatingCostDto)
  operatingCosts?: PackageOperatingCostDto[];
}

export class UpdatePackageDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precio?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  porcentajeMedico?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  porcentajeCentro?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PackageDetailDto)
  details?: PackageDetailDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PackageOperatingCostDto)
  operatingCosts?: PackageOperatingCostDto[];
}
