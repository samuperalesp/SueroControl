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

export async function fetchDashboard(warehouseId?: string): Promise<DashboardSummary> {
  const qs = warehouseId ? `?warehouseId=${encodeURIComponent(warehouseId)}` : '';
  const res = await apiFetch(`/dashboard${qs}`);
  if (!res.ok) throw new Error('Error al obtener datos del dashboard');
  return res.json();
}
