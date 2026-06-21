export interface PurchaseDetail {
  id: string;
  purchaseId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  subTotal: number;
}

export interface Purchase {
  id: string;
  tipo: string;
  pedidoId?: string;
  facturaNumero?: string;
  terceroId?: string;
  total: number;
  createdAt: string;
  details?: PurchaseDetail[];
}

export interface PurchaseDetailDto {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseDto {
  tipo?: string;
  pedidoId?: string;
  facturaNumero?: string;
  terceroId?: string;
  details: PurchaseDetailDto[];
}
