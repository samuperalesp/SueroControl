import type { Package, CreatePackageDto, UpdatePackageDto } from '../types/package';
import { apiFetch } from './helpers';

const BASE = '/packages';

export async function fetchPackages(): Promise<Package[]> {
  const res = await apiFetch(BASE);
  if (!res.ok) throw new Error('Error al obtener paquetes');
  return res.json();
}

export async function fetchPackage(id: string): Promise<Package> {
  const res = await apiFetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Error al obtener paquete');
  return res.json();
}

export async function createPackage(dto: CreatePackageDto): Promise<Package> {
  const res = await apiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al crear paquete');
  }
  return res.json();
}

export async function updatePackage(id: string, dto: UpdatePackageDto): Promise<Package> {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al actualizar paquete');
  }
  return res.json();
}

export async function deletePackage(id: string): Promise<void> {
  const res = await apiFetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar paquete');
}

export async function sellPackage(id: string, terceroId?: string): Promise<any> {
  const res = await apiFetch(`${BASE}/${id}/sell`, {
    method: 'POST',
    body: JSON.stringify({ terceroId }),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al vender paquete');
  }
  return res.json();
}
