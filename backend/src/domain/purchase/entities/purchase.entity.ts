import { PurchaseDetail } from './purchase-detail.entity';

export class Purchase {
  id: string;
  tipo: string;
  pedidoId?: string;
  facturaNumero?: string;
  terceroId?: string;
  total: number;
  createdAt: Date;
  details?: PurchaseDetail[];
}
