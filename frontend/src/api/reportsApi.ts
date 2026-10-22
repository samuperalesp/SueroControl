import { apiFetch } from './helpers';

export interface ProfessionalEarningsSummaryRow {
  medicoId: string | null;
  profesional: string;
  operaciones: number;
  ventas: number;
  costoMedicamentos: number;
  costoOperativo: number;
  costoTotal: number;
  utilidad: number;
  gananciaProfesional: number;
  gananciaCentro: number;
}

export interface ProfessionalEarningsDetailRow {
  salePackageId: string;
  fecha: string;
  tipoOperacion: string;
  consecutivo: number;
  comprobante: string;
  paciente: string | null;
  paquete: string | null;
  medicoId: string | null;
  profesional: string;
  valorVenta: number;
  costoMedicamentos: number;
  costoOperativo: number;
  costoTotal: number;
  utilidad: number;
  porcentajeProfesional: number;
  gananciaProfesional: number;
  porcentajeCentro: number;
  gananciaCentro: number;
  almacen: string | null;
  sesionNumero: number | null;
  sesionesTotales: number | null;
}

export interface ProfessionalEarningsTotals {
  operaciones: number;
  ventas: number;
  costoMedicamentos: number;
  costoOperativo: number;
  costoTotal: number;
  utilidad: number;
  gananciaProfesional: number;
  gananciaCentro: number;
}

export interface ProfessionalEarningsReport {
  filters: {
    fromDate: string | null;
    toDate: string | null;
    warehouseId: string | null;
    medicoId: string | null;
  };
  summary: ProfessionalEarningsSummaryRow[];
  detail: ProfessionalEarningsDetailRow[];
  totals: ProfessionalEarningsTotals;
}

export interface ProfessionalEarningsFilters {
  fromDate?: string;
  toDate?: string;
  warehouseId?: string;
  medicoId?: string;
}

export async function fetchProfessionalEarnings(
  filters: ProfessionalEarningsFilters,
): Promise<ProfessionalEarningsReport> {
  const params = new URLSearchParams();
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  if (filters.warehouseId) params.set('warehouseId', filters.warehouseId);
  if (filters.medicoId) params.set('medicoId', filters.medicoId);
  const qs = params.toString();
  const res = await apiFetch(`/reports/professional-earnings${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Error al obtener el reporte de ganancias por profesional');
  return res.json();
}
