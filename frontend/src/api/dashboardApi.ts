import { apiFetch } from './helpers';

export interface DashboardSummary {
  ventasTotales: number;
  costosTotales: number;
  gananciaMedicos: number;
  gananciaCentro: number;
  utilidadTotal: number;
  totalSales: number;
  totalPackagesSold: number;
}

export async function fetchDashboard(): Promise<DashboardSummary> {
  const res = await apiFetch('/dashboard');
  if (!res.ok) throw new Error('Error al obtener datos del dashboard');
  return res.json();
}
