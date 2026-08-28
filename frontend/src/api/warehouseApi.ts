import type { Warehouse, TransferStockDto } from '../types/warehouse';
import { apiFetch } from './helpers';

const BASE = '/warehouses';

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const res = await apiFetch(BASE);
  if (!res.ok) throw new Error('Error al obtener almacenes');
  return res.json();
}

export async function fetchAllWarehouses(): Promise<Warehouse[]> {
  const res = await apiFetch(`${BASE}/all`);
  if (!res.ok) throw new Error('Error al obtener almacenes');
  return res.json();
}

export async function createWarehouse(dto: { nombre: string; esPrincipal?: boolean; activo?: boolean }): Promise<Warehouse> {
  const res = await apiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al crear almacén');
  }
  return res.json();
}

export async function updateWarehouse(id: string, dto: { nombre?: string; esPrincipal?: boolean; activo?: boolean }): Promise<Warehouse> {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al actualizar almacén');
  }
  return res.json();
}

export async function deleteWarehouse(id: string): Promise<void> {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al eliminar almacén');
  }
}

export async function transferStock(dto: TransferStockDto): Promise<any> {
  const res = await apiFetch(`${BASE}/transfer`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al trasladar stock');
  }
  return res.json();
}
