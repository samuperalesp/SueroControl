import { apiFetch } from './helpers';

export interface TopMedico {
  id: string;
  nombre: string;
  total: number;
}

export interface DashboardSummary {
  ventasTotales: number;
  comprasTotales: number;
  gananciaCentro: number;
  utilidadTotal: number;
  totalSales: number;
  totalPackagesSold: number;
  topMedicos: TopMedico[];
}

export async function fetchDashboard(
  warehouseId?: string,
  fromDate?: string,
  toDate?: string,
): Promise<DashboardSummary> {
  const params = new URLSearchParams();
  if (warehouseId) params.set('warehouseId', warehouseId);
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate) params.set('toDate', toDate);
  const qs = params.toString();
  const res = await apiFetch(`/dashboard${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Error al obtener datos del dashboard');
  return res.json();
}
