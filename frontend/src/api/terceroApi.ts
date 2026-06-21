import type { Tercero, CreateTerceroDto } from '../types/tercero';
import { apiFetch } from './helpers';

const BASE = '/terceros';

export async function fetchTerceros(): Promise<Tercero[]> {
  const res = await apiFetch(BASE);
  if (!res.ok) throw new Error('Error al obtener terceros');
  return res.json();
}

export async function createTercero(dto: CreateTerceroDto): Promise<Tercero> {
  const res = await apiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al crear tercero');
  }
  return res.json();
}

export async function updateTercero(id: string, dto: CreateTerceroDto): Promise<Tercero> {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al actualizar tercero');
  }
  return res.json();
}

export async function deleteTercero(id: string): Promise<void> {
  const res = await apiFetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar tercero');
}
