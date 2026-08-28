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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 mx-4">
        <h2 className="text-xl font-bold mb-1 text-gray-800">Trasladar stock</h2>
        <p className="text-sm text-gray-500 mb-4">Mueve inventario entre almacenes. No es una venta.</p>

        {errors.general && <p className="text-red-500 text-xs mb-3">{errors.general}</p>}

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Almacén origen</label>
            <select
              value={origenId}
              onChange={e => {
                const v = e.target.value;
                setOrigenId(v);
                setDestinoId(d => (d === v ? '' : d));
              }}
              className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors.origen ? 'border-red-400' : 'border-gray-300'}`}
            >
              {activeWarehouses.map(w => (
                <option key={w.id} value={w.id}>{w.nombre}</option>
              ))}
            </select>
            {errors.origen && <span className="text-xs text-red-500">{errors.origen}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Almacén destino</label>
            <select
              value={destinoId}
              onChange={e => setDestinoId(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors.destino ? 'border-red-400' : 'border-gray-300'}`}
            >
              {activeWarehouses.filter(w => w.id !== origenId).map(w => (
                <option key={w.id} value={w.id}>{w.nombre}</option>
              ))}
            </select>
            {errors.destino && <span className="text-xs text-red-500">{errors.destino}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Fecha del traslado</label>
            <input
              type="date"
              value={fecha}
              max={todayISO()}
              onChange={e => setFecha(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors.fecha ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.fecha && <span className="text-xs text-red-500">{errors.fecha}</span>}
          </div>
        </div>

        <div className="text-xs font-medium text-gray-600 mb-2">Productos</div>

        <div ref={searchRef} className="relative mb-3">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setSearchMsg(''); setOpenDropdown(true); }}
            onFocus={() => setOpenDropdown(true)}
            placeholder="Buscar producto por nombre o código..."
            autoComplete="off"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
          {searchMsg && <p className="text-xs text-amber-600 mt-1">{searchMsg}</p>}
          {openDropdown && filteredProducts.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredProducts.map(p => (
                <li key={p.id} onClick={() => addProduct(p)}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex justify-between">
                  <span className="font-medium">{p.codigo}</span>
                  <span className="text-gray-500 ml-2">{p.nombre}</span>
                  <span className="text-gray-400 ml-auto">Stock: {p.stockActual}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 mb-3">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Producto</th>
                  <th className="px-4 py-2 font-medium">Stock</th>
                  <th className="px-4 py-2 font-medium">Cantidad</th>
                  <th className="px-4 py-2 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.map((l, idx) => {
                  const p = products.find(pr => pr.id === l.productId);
                  const stock = stockDe(l.productId);
                  return (
                    <tr key={l.productId}>
                      <td className="px-4 py-2">
                        <p className="font-medium text-gray-800">{p?.nombre || l.productId}</p>
                        {p && <p className="text-xs text-gray-400">{p.codigo}</p>}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{stock}</td>
                      <td className="px-4 py-2 w-28">
                        <input
                          type="number"
                          min={1}
                          max={stock || undefined}
                          value={l.cantidad}
                          onChange={e => updateCantidad(idx, parseInt(e.target.value) || 0)}
                          className={`border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors[`linea-${idx}`] ? 'border-red-400' : 'border-gray-300'}`}
                        />
                        {errors[`linea-${idx}`] && <p className="text-xs text-red-500">{errors[`linea-${idx}`]}</p>}
                      </td>
                      <td className="px-4 py-2">
                        <button type="button" onClick={() => removeLine(idx)}
                          className="text-red-500 hover:text-red-700 text-lg cursor-pointer" title="Quitar">🗑</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <button type="button" onClick={() => searchRef.current?.querySelector('input')?.focus()}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
          + Agregar producto
        </button>
        {errors.lineas && <p className="text-xs text-red-500 mt-1">{errors.lineas}</p>}

        {lines.length > 0 && origen && destino && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
            <p className="text-gray-700">
              Resumen: {lines.length} producto{lines.length > 1 ? 's' : ''} · {lines.reduce((s, l) => s + l.cantidad, 0)} unidades
              desde <span className="font-medium">{origen.nombre}</span> hacia <span className="font-medium">{destino.nombre}</span>
              {fecha ? ` · ${fecha}` : ''}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            {saving ? 'Trasladando...' : 'Trasladar stock'}
          </button>
        </div>
      </form>
    </div>
  );
}
