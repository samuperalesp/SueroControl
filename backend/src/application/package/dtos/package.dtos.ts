import { IsString, IsNumber, IsBoolean, IsArray, Min, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PackageDetailDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreatePackageDto {
  @IsString()
  nombre: string;

  @IsNumber()
  @Min(0)
  precio: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageDetailDto)
  details: PackageDetailDto[];
}

export class UpdatePackageDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precio?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
