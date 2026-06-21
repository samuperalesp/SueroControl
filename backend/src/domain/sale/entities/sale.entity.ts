import { SaleDetail } from './sale-detail.entity';

export class Sale {
  id: string;
  consecutivo: number;
  terceroId?: string;
  total: number;
  estado: string;
  anuladaMotivo?: string;
  anuladaAt?: Date;
  createdAt: Date;
  details?: SaleDetail[];
}
