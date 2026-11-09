import { apiFetch } from './helpers';

export interface TopMedico {
  id: string;
  nombre: string;
  total: number;
}

export interface DashboardSummary {
  ventasTotales: number;
  comprasTotales: number;
  gananciaCentro: number;
  utilidadTotal: number;
  totalSales: number;
  totalPackagesSold: number;
  topMedicos: TopMedico[];
}

interface InventoryMovementRow {
  id: string;
  productId: string;
  movementType: string;
  quantity: number;
  createdAt: string;
  product?: {
    id: string;
    codigo: string;
    nombre: string;
  };
}

interface SaleRow {
  id: string;
  estado: string;
  details?: {
    packageId?: string | null;
    quantity: number;
  }[];
}

interface PackageRow {
  id: string;
  nombre: string;
}

export interface TopMovingProduct {
  productId: string;
  nombre: string;
  codigo: string;
  total: number;
  entradas: number;
  salidas: number;
}

export interface TopSoldPackage {
  packageId: string;
  nombre: string;
  totalUnidades: number;
  ventas: number;
}

export interface DashboardAnalytics {
  topProducts: TopMovingProduct[];
  topPackages: TopSoldPackage[];
}

function toLocalDateKey(value: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function fetchDashboardAnalytics(
  warehouseId?: string,
  fromDate?: string,
  toDate?: string,
): Promise<DashboardAnalytics> {
  const movementParams = new URLSearchParams();
  if (warehouseId) movementParams.set('warehouseId', warehouseId);
  const movementQs = movementParams.toString();

  const salesParams = new URLSearchParams();
  if (warehouseId) salesParams.set('warehouseId', warehouseId);
  if (fromDate) salesParams.set('fechaDesde', fromDate);
  if (toDate) salesParams.set('fechaHasta', toDate);
  const salesQs = salesParams.toString();

  const [movementsRes, salesRes, packagesRes] = await Promise.all([
    apiFetch(`/inventory-movements${movementQs ? `?${movementQs}` : ''}`),
    apiFetch(`/sales${salesQs ? `?${salesQs}` : ''}`),
    apiFetch('/packages'),
  ]);

  if (!movementsRes.ok || !salesRes.ok || !packagesRes.ok) {
    throw new Error('Error al obtener las analíticas del dashboard');
  }

  const [movements, sales, packages] = (await Promise.all([
    movementsRes.json(),
    salesRes.json(),
    packagesRes.json(),
  ])) as [InventoryMovementRow[], SaleRow[], PackageRow[]];

  const productMap = new Map<string, TopMovingProduct>();
  for (const movement of movements) {
    const dateKey = toLocalDateKey(movement.createdAt);
    if (fromDate && (!dateKey || dateKey < fromDate)) continue;
    if (toDate && (!dateKey || dateKey > toDate)) continue;

    const current = productMap.get(movement.productId) ?? {
      productId: movement.productId,
      nombre: movement.product?.nombre ?? 'Producto',
      codigo: movement.product?.codigo ?? '',
      total: 0,
      entradas: 0,
      salidas: 0,
    };

    current.total += movement.quantity;
    if (movement.movementType === 'ENTRY') current.entradas += movement.quantity;
    if (movement.movementType === 'EXIT') current.salidas += movement.quantity;
    productMap.set(movement.productId, current);
  }

  const packageNames = new Map(packages.map(pkg => [pkg.id, pkg.nombre]));
  const packageMap = new Map<
    string,
    { nombre: string; totalUnidades: number; ventas: Set<string> }
  >();

  for (const sale of sales) {
    if (sale.estado !== 'ACTIVA') continue;

    for (const detail of sale.details ?? []) {
      if (!detail.packageId || detail.quantity <= 0) continue;

      const current = packageMap.get(detail.packageId) ?? {
        nombre: packageNames.get(detail.packageId) ?? 'Paquete no disponible',
        totalUnidades: 0,
        ventas: new Set<string>(),
      };

      current.totalUnidades += detail.quantity;
      current.ventas.add(sale.id);
      packageMap.set(detail.packageId, current);
    }
  }

  return {
    topProducts: Array.from(productMap.values())
      .sort((a, b) => b.total - a.total)
      .map(product => ({ ...product, total: Math.round(product.total * 100) / 100 })),
    topPackages: Array.from(packageMap.entries())
      .map(([packageId, data]) => ({
        packageId,
        nombre: data.nombre,
        totalUnidades: data.totalUnidades,
        ventas: data.ventas.size,
      }))
      .sort((a, b) => b.totalUnidades - a.totalUnidades),
  };
}

export async function fetchDashboard(
  warehouseId?: string,
  fromDate?: string,
  toDate?: string,
): Promise<DashboardSummary> {
  const params = new URLSearchParams();
  if (warehouseId) params.set('warehouseId', warehouseId);
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate) params.set('toDate', toDate);
  const qs = params.toString();
  const res = await apiFetch(`/dashboard${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Error al obtener datos del dashboard');
  return res.json();
}
