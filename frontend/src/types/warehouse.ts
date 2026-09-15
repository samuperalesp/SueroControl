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

export interface TransferHistoryItem {
  productId: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  stockOrigenBefore: number | null;
  stockOrigenAfter: number | null;
  stockDestinoBefore: number | null;
  stockDestinoAfter: number | null;
}

export interface TransferHistory {
  id: string;
  fecha: string;
  origen: { id: string; nombre: string } | null;
  destino: { id: string; nombre: string } | null;
  productosDiferentes: number;
  totalUnidades: number;
  items: TransferHistoryItem[];
}
