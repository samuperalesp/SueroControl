import { apiFetch } from './helpers';

export interface TopMedico {
  id: string;
  nombre: string;
  total: number;
}

export interface DashboardSummary {
  ventasTotales: number;
  costosTotales: number;
  gananciaCentro: number;
  utilidadTotal: number;
  totalSales: number;
  totalPackagesSold: number;
  topMedicos: TopMedico[];
}

export async function fetchDashboard(): Promise<DashboardSummary> {
  const res = await apiFetch('/dashboard');
  if (!res.ok) throw new Error('Error al obtener datos del dashboard');
  return res.json();
}
