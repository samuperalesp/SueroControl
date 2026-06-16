import type { Product, CreateProductDto } from '../types/product';

const BASE = '/products';

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Producto no encontrado');
  return res.json();
}

export async function createProduct(dto: CreateProductDto): Promise<Product> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al crear producto');
  }
  return res.json();
}

export async function updateProduct(id: string, dto: Partial<CreateProductDto>): Promise<Product> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Error al actualizar producto');
  }
  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar producto');
}
