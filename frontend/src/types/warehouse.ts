export interface Warehouse {
  id: string;
  nombre: string;
  esPrincipal: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransferLineDto {
  productId: string;
  cantidad: number;
}

export interface TransferStockDto {
  origenId: string;
  destinoId: string;
  fecha?: string;
  observacion?: string;
  lineas: TransferLineDto[];
}
