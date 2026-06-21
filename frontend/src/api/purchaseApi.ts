import type { Purchase, CreatePurchaseDto } from '../types/purchase';
import { apiFetch } from './helpers';

const BASE = '/purchases';

export async function fetchPurchases(): Promise<Purchase[]> {
  const res = await apiFetch(BASE);
  if (!res.ok) throw new Error('Error al obtener compras');
  return res.json();
}

export async function fetchPurchase(id: string): Promise<Purchase> {
  const res = await apiFetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Compra no encontrada');
  return res.json();
}

export async function createPurchase(dto: CreatePurchaseDto): Promise<Purchase> {
  const res = await apiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al crear compra');
  }
  return res.json();
}

export async function convertPedidoToCompra(id: string): Promise<Purchase> {
  const res = await apiFetch(`${BASE}/${id}/convert`, {
    method: 'PUT',
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al convertir pedido');
  }
  return res.json();
}
