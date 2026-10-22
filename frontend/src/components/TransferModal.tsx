import { useState, useEffect, useCallback, useRef } from 'react';
import { useWarehouse } from '../context/WarehouseContext';
import { fetchProducts } from '../api/productApi';
import { transferStock } from '../api/warehouseApi';
import type { Product } from '../types/product';

interface Line {
  productId: string;
  cantidad: number;
}

interface Props {
  onClose: () => void;
  onTransferred: () => void;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function TransferModal({ onClose, onTransferred }: Props) {
  const { warehouses, selectedWarehouseId } = useWarehouse();
  const [origenId, setOrigenId] = useState<string>(selectedWarehouseId ?? warehouses[0]?.id ?? '');
  const [destinoId, setDestinoId] = useState<string>('');
  const [fecha, setFecha] = useState(todayISO());
  const [lines, setLines] = useState<Line[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [openDropdown, setOpenDropdown] = useState(false);
  const [searchMsg, setSearchMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const searchRef = useRef<HTMLDivElement | null>(null);

  const activeWarehouses = warehouses.filter(w => w.activo);

  useEffect(() => {
    if (!destinoId) {
      const first = activeWarehouses.find(w => w.id !== origenId);
      setDestinoId(first?.id ?? '');
    }
  }, [activeWarehouses, origenId, destinoId]);

  const loadProducts = useCallback(async (wid: string) => {
    try {
      const data = await fetchProducts(wid);
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (origenId) loadProducts(origenId);
  }, [origenId, loadProducts]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpenDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = products.filter(p =>
    p.activo &&
    search.trim() !== '' &&
    (p.codigo.toLowerCase().includes(search.toLowerCase()) || p.nombre.toLowerCase().includes(search.toLowerCase())),
  );

  const origen = activeWarehouses.find(w => w.id === origenId);
  const destino = activeWarehouses.find(w => w.id === destinoId);

  function stockDe(productId: string): number {
    return products.find(p => p.id === productId)?.stockActual ?? 0;
  }

  function addProduct(p: Product) {
    if (lines.some(l => l.productId === p.id)) {
      setSearchMsg('El producto ya está en el traslado');
      return;
    }
    setLines([...lines, { productId: p.id, cantidad: 1 }]);
    setSearch('');
    setSearchMsg('');
    setOpenDropdown(false);
  }

  function updateCantidad(idx: number, value: number) {
    setLines(lines.map((l, i) => (i === idx ? { ...l, cantidad: value } : l)));
  }

  function removeLine(idx: number) {
    setLines(lines.filter((_, i) => i !== idx));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!origenId) errs.origen = 'Seleccione el almacén origen';
    if (!destinoId) errs.destino = 'Seleccione el almacén destino';
    if (origenId && destinoId && origenId === destinoId) errs.destino = 'El destino debe ser diferente al origen';
    if (!fecha) errs.fecha = 'Seleccione la fecha';
    if (lines.length === 0) errs.lineas = 'Agregue al menos un producto';
    lines.forEach((l, i) => {
      if (l.cantidad < 1) errs[`linea-${i}`] = 'Cantidad inválida';
      else if (l.cantidad > stockDe(l.productId)) errs[`linea-${i}`] = `Supera el stock (${stockDe(l.productId)})`;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await transferStock({
        origenId,
        destinoId,
        fecha,
        lineas: lines.map(l => ({ productId: l.productId, cantidad: l.cantidad })),
      });
      onTransferred();
      onClose();
    } catch (e: any) {
      setErrors({ general: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm sc-fade-in dark:bg-black/70">
      <form onSubmit={handleSubmit} className="sc-slide-up rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:shadow-black/40 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 mx-4">
        <h2 className="mb-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Trasladar stock</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Mueve inventario entre almacenes. No es una venta.</p>

        {errors.general && <p className="text-red-500 dark:text-red-400 text-xs mb-3">{errors.general}</p>}

        <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Almacén origen</label>
            <select
              value={origenId}
              onChange={e => {
                const v = e.target.value;
                setOrigenId(v);
                setDestinoId(d => (d === v ? '' : d));
              }}
              className={`border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors.origen ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`}
            >
              {activeWarehouses.map(w => (
                <option key={w.id} value={w.id}>{w.nombre}</option>
              ))}
            </select>
            {errors.origen && <span className="text-xs text-red-500 dark:text-red-400">{errors.origen}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Almacén destino</label>
            <select
              value={destinoId}
              onChange={e => setDestinoId(e.target.value)}
              className={`border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors.destino ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`}
            >
              {activeWarehouses.filter(w => w.id !== origenId).map(w => (
                <option key={w.id} value={w.id}>{w.nombre}</option>
              ))}
            </select>
            {errors.destino && <span className="text-xs text-red-500 dark:text-red-400">{errors.destino}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Fecha del traslado</label>
            <input
              type="date"
              value={fecha}
              max={todayISO()}
              onChange={e => setFecha(e.target.value)}
              className={`border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors.fecha ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`}
            />
            {errors.fecha && <span className="text-xs text-red-500 dark:text-red-400">{errors.fecha}</span>}
          </div>
        </div>

        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Productos</div>

        <div ref={searchRef} className="relative mb-3">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setSearchMsg(''); setOpenDropdown(true); }}
            onFocus={() => setOpenDropdown(true)}
            placeholder="Buscar producto por nombre o código..."
            autoComplete="off"
            className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
          {searchMsg && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{searchMsg}</p>}
          {openDropdown && filteredProducts.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {filteredProducts.map(p => (
                <li key={p.id} onClick={() => addProduct(p)}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 flex justify-between">
                  <span className="font-medium">{p.codigo}</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-2">{p.nombre}</span>
                  <span className="text-slate-400 dark:text-slate-500 ml-auto">Stock: {p.stockActual}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 mb-3">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Producto</th>
                  <th className="px-4 py-2 font-medium">Stock</th>
                  <th className="px-4 py-2 font-medium">Cantidad</th>
                  <th className="px-4 py-2 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lines.map((l, idx) => {
                  const p = products.find(pr => pr.id === l.productId);
                  const stock = stockDe(l.productId);
                  return (
                    <tr key={l.productId}>
                      <td className="px-4 py-2">
                        <p className="font-medium text-slate-800 dark:text-slate-100">{p?.nombre || l.productId}</p>
                        {p && <p className="text-xs text-slate-400 dark:text-slate-500">{p.codigo}</p>}
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{stock}</td>
                      <td className="px-4 py-2 w-28">
                        <input
                          type="number"
                          min={1}
                          max={stock || undefined}
                          value={l.cantidad}
                          onChange={e => updateCantidad(idx, parseInt(e.target.value) || 0)}
                          className={`border rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors[`linea-${idx}`] ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`}
                        />
                        {errors[`linea-${idx}`] && <p className="text-xs text-red-500 dark:text-red-400">{errors[`linea-${idx}`]}</p>}
                      </td>
                      <td className="px-4 py-2">
                        <button type="button" onClick={() => removeLine(idx)}
                          className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-lg cursor-pointer" title="Quitar">🗑</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <button type="button" onClick={() => searchRef.current?.querySelector('input')?.focus()}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium cursor-pointer">
          + Agregar producto
        </button>
        {errors.lineas && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.lineas}</p>}

        {lines.length > 0 && origen && destino && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl px-4 py-3 text-sm">
            <p className="text-slate-700 dark:text-slate-200">
              Resumen: {lines.length} producto{lines.length > 1 ? 's' : ''} · {lines.reduce((s, l) => s + l.cantidad, 0)} unidades
              desde <span className="font-medium">{origen.nombre}</span> hacia <span className="font-medium">{destino.nombre}</span>
              {fecha ? ` · ${fecha}` : ''}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-blue-500 hover:bg-slate-800 dark:hover:bg-blue-400 disabled:opacity-50 cursor-pointer">
            {saving ? 'Trasladando...' : 'Trasladar stock'}
          </button>
        </div>
      </form>
    </div>
  );
}
