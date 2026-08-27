import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

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
