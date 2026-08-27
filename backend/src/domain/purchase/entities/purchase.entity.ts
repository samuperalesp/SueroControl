import { PurchaseDetail } from './purchase-detail.entity';

export class Purchase {
  id: string;
  tipo: string;
  pedidoId?: string;
  facturaNumero?: string;
  terceroId?: string;
  warehouseId?: string;
  total: number;
  fechaCompra?: Date;
  createdAt: Date;
  details?: PurchaseDetail[];
}
