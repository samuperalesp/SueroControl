export interface SaleDetail {
  id: string;
  saleId: string;
  productId?: string;
  packageId?: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface Sale {
  id: string;
  consecutivo: number;
  terceroId?: string;
  medicoId?: string;
  total: number;
  costoTotal?: number;
  utilidadTotal?: number;
  gananciaMedico?: number;
  gananciaCentro?: number;
  estado: string;
  anuladaMotivo?: string;
  anuladaAt?: string;
  createdAt: string;
  updatedAt: string;
  details?: SaleDetail[];
}

export interface SaleDetailDto {
  productId?: string;
  packageId?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleDto {
  terceroId?: string;
  medicoId: string;
  details: SaleDetailDto[];
}

export interface UpdateSaleDto {
  terceroId?: string;
  medicoId?: string;
  details?: SaleDetailDto[];
}

export interface CancelSaleDto {
  motivo: string;
}

export interface SaleSearchParams {
  consecutivo?: number;
  terceroId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface ComprobanteData {
  comprobante: string;
  consecutivo: number;
  fecha: string;
  estado: string;
  anuladaMotivo?: string;
  cliente: {
    nombre: string;
    documento: string;
    direccion?: string;
    telefono?: string;
  } | null;
  items: {
    producto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
  total: number;
}

export interface PackageSession {
  id: string;
  saleId: string;
  patientId?: string;
  medicoId: string;
  packageId: string;
  cantidadSesiones: number;
  sesionesConsumidas: number;
  sesionesPendientes: number;
  precioUnitario: number;
  subtotal: number;
  descuentoPorcentaje: number;
  descuentoValor: number;
  totalPagado: number;
  estado: string;
  fechaInicio: string;
  fechaVencimiento?: string;
  createdAt: string;
  updatedAt: string;
  sale?: Sale;
  patient?: any;
  medico?: any;
  package?: any;
  applications?: SessionApplication[];
}

export interface SessionApplication {
  id: string;
  packageSessionId: string;
  salePackageId?: string;
  sesionNumero: number;
  fechaAplicacion: string;
  observaciones?: string;
  userId?: string;
  createdAt: string;
}

export interface CreatePackageSessionDto {
  patientId?: string;
  medicoId: string;
  packageId: string;
  cantidadSesiones: number;
  descuentoPorcentaje: number;
  fechaVencimiento?: string;
}
