import type { Sale, CreateSaleDto, UpdateSaleDto, CancelSaleDto, SaleSearchParams, ComprobanteData, PackageSession, CreatePackageSessionDto } from '../types/sale';
import { apiFetch } from './helpers';

const BASE = '/sales';

export async function fetchSales(params?: SaleSearchParams): Promise<Sale[]> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as [string, string][]
  ).toString() : '';
  const res = await apiFetch(BASE + qs);
  if (!res.ok) throw new Error('Error al obtener ventas');
  return res.json();
}

export async function createSale(dto: CreateSaleDto): Promise<Sale> {
  const res = await apiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al crear venta');
  }
  return res.json();
}

export async function updateSale(id: string, dto: UpdateSaleDto): Promise<Sale> {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al actualizar venta');
  }
  return res.json();
}

export async function cancelSale(id: string, dto: CancelSaleDto): Promise<Sale> {
  const res = await apiFetch(`${BASE}/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al anular venta');
  }
  return res.json();
}

export async function fetchComprobante(id: string): Promise<ComprobanteData> {
  const res = await apiFetch(`${BASE}/comprobante/${id}`);
  if (!res.ok) throw new Error('Error al obtener comprobante');
  return res.json();
}

// Paquete x Sesiones
const PS_BASE = '/package-sessions';

export async function fetchPackageSessions(): Promise<PackageSession[]> {
  const res = await apiFetch(PS_BASE);
  if (!res.ok) throw new Error('Error al obtener paquetes por sesiones');
  return res.json();
}

export async function createPackageSession(dto: CreatePackageSessionDto): Promise<PackageSession> {
  const res = await apiFetch(PS_BASE, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al crear paquete por sesiones');
  }
  return res.json();
}

export async function fetchPackageSession(id: string): Promise<PackageSession> {
  const res = await apiFetch(`${PS_BASE}/${id}`);
  if (!res.ok) throw new Error('Error al obtener detalle');
  return res.json();
}

export async function applyPackageSession(id: string, dto?: { observaciones?: string }): Promise<PackageSession> {
  const res = await apiFetch(`${PS_BASE}/${id}/apply`, {
    method: 'POST',
    body: JSON.stringify(dto || {}),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al aplicar sesión');
  }
  return res.json();
}

export async function cancelPackageSession(id: string): Promise<PackageSession> {
  const res = await apiFetch(`${PS_BASE}/${id}/cancel`, {
    method: 'PATCH',
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al cancelar');
  }
  return res.json();
}
