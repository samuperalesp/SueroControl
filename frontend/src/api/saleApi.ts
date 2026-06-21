import type { Sale, CreateSaleDto, UpdateSaleDto, CancelSaleDto, SaleSearchParams, ComprobanteData } from '../types/sale';

const BASE = '/sales';

export async function fetchSales(params?: SaleSearchParams): Promise<Sale[]> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as [string, string][]
  ).toString() : '';
  const res = await fetch(BASE + qs);
  if (!res.ok) throw new Error('Error al obtener ventas');
  return res.json();
}

export async function createSale(dto: CreateSaleDto): Promise<Sale> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al crear venta');
  }
  return res.json();
}

export async function updateSale(id: string, dto: UpdateSaleDto): Promise<Sale> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al actualizar venta');
  }
  return res.json();
}

export async function cancelSale(id: string, dto: CancelSaleDto): Promise<Sale> {
  const res = await fetch(`${BASE}/${id}/cancel`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al anular venta');
  }
  return res.json();
}

export async function fetchComprobante(id: string): Promise<ComprobanteData> {
  const res = await fetch(`${BASE}/comprobante/${id}`);
  if (!res.ok) throw new Error('Error al obtener comprobante');
  return res.json();
}
