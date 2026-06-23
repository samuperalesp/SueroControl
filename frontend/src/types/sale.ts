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
