export interface Tercero {
  id: string;
  tipoRelacion: string;
  tipoPersona: string;
  tipoDocumento: string;
  numeroDocumento: string;
  digitoVerificacion?: string;
  nombres?: string;
  apellidos?: string;
  razonSocial?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  telefono?: string;
  email?: string;
  observaciones?: string;
  activo: boolean;
}

export interface CreateTerceroDto {
  tipoRelacion: string;
  tipoPersona: string;
  tipoDocumento: string;
  numeroDocumento: string;
  digitoVerificacion?: string;
  nombres?: string;
  apellidos?: string;
  razonSocial?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  telefono?: string;
  email?: string;
  observaciones?: string;
  activo?: boolean;
}

export type UpdateTerceroDto = Partial<CreateTerceroDto>;
