import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

const DOCUMENTOS_CO = ['CC', 'CE', 'NIT', 'PAS', 'TI'] as const;

export class CreateTerceroDto {
  @IsString()
  @IsIn(['CLIENTE', 'PROVEEDOR', 'CLIENTE_PROVEEDOR'])
  tipoRelacion: string;

  @IsString()
  @IsIn(['NATURAL', 'JURIDICA'])
  tipoPersona: string;

  @IsString()
  @IsIn(DOCUMENTOS_CO)
  tipoDocumento: string;

  @IsString()
  numeroDocumento: string;

  @IsString()
  @IsOptional()
  digitoVerificacion?: string;

  @IsString()
  @IsOptional()
  nombres?: string;

  @IsString()
  @IsOptional()
  apellidos?: string;

  @IsString()
  @IsOptional()
  razonSocial?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  ciudad?: string;

  @IsString()
  @IsOptional()
  departamento?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateTerceroDto extends PartialType(CreateTerceroDto) {}
