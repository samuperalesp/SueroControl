import { useState, useRef, useEffect } from 'react';
import type { Product } from '../types/product';
import type { Tercero } from '../types/tercero';
import type { PurchaseDetail } from '../types/purchase';

interface LineItem {
  productId: string;
  quantity: number;
  unitCost: number;
}

interface Props {
  tipo: 'COMPRA' | 'PEDIDO';
  products: Product[];
  proveedores: Tercero[];
  initialData?: {
    id: string;
    facturaNumero?: string;
    terceroId?: string;
    details?: PurchaseDetail[];
  };
  onSave: (data: { facturaNumero?: string; terceroId?: string; fechaCompra?: string; details: LineItem[] }) => Promise<void>;
  onClose: () => void;
}

export default function PurchaseModal({ tipo, products, proveedores, initialData, onSave, onClose }: Props) {
  const [items, setItems] = useState<LineItem[]>(() => {
    if (initialData?.details && initialData.details.length > 0) {
      return initialData.details.map(d => ({ productId: d.productId, quantity: d.quantity, unitCost: d.unitCost }));
    }
    return [{ productId: '', quantity: 1, unitCost: 0 }];
  });
  const [searchTexts, setSearchTexts] = useState<string[]>(() => {
    if (initialData?.details && initialData.details.length > 0) {
      return initialData.details.map(d => {
        const p = products.find(pr => pr.id === d.productId);
        return p ? `${p.codigo} - ${p.nombre}` : '';
      });
    }
    return [''];
  });
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [facturaNumero, setFacturaNumero] = useState(initialData?.facturaNumero || '');
  const [selectedProveedorId, setSelectedProveedorId] = useState(initialData?.terceroId || '');
  const [proveedorSearch, setProveedorSearch] = useState(() => {
    if (initialData?.terceroId) {
      const t = proveedores.find(p => p.id === initialData.terceroId);
      if (t) return t.tipoPersona === 'NATURAL' ? `${t.nombres} ${t.apellidos}` : t.razonSocial || '';
    }
    return '';
  });
  const [showProveedorDropdown, setShowProveedorDropdown] = useState(false);
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const searchRefs = useRef<(HTMLDivElement | null)[]>([]);
  const proveedorRef = useRef<HTMLDivElement | null>(null);

  const activeProducts = products.filter(p => p.activo);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (openDropdown !== null && searchRefs.current[openDropdown] && !searchRefs.current[openDropdown]!.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
      if (proveedorRef.current && !proveedorRef.current.contains(e.target as Node)) {
        setShowProveedorDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  function getFiltered(search: string) {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return activeProducts.filter(p => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q));
  }

  function selectProduct(idx: number, product: Product) {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, productId: product.id, unitCost: product.costoCompra } : item,
    );
    setItems(updated);
    const newSearches = [...searchTexts];
    newSearches[idx] = `${product.codigo} - ${product.nombre}`;
    setSearchTexts(newSearches);
    setOpenDropdown(null);
  }

  function updateSearch(idx: number, value: string) {
    const newSearches = [...searchTexts];
    newSearches[idx] = value;
    setSearchTexts(newSearches);
    setOpenDropdown(idx);
    if (!value.trim()) {
      setItems(items.map((item, i) => i === idx ? { ...item, productId: '' } : item));
    }
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item,
    );
    setItems(updated);
  }

  function addItem() {
    setItems([...items, { productId: '', quantity: 1, unitCost: 0 }]);
    setSearchTexts([...searchTexts, '']);
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
    setSearchTexts(searchTexts.filter((_, i) => i !== idx));
    if (openDropdown === idx) setOpenDropdown(null);
  }

  function selectProveedor(t: Tercero) {
    setSelectedProveedorId(t.id);
    setProveedorSearch(t.tipoPersona === 'NATURAL' ? `${t.nombres} ${t.apellidos}` : t.razonSocial || '');
    setShowProveedorDropdown(false);
  }

  function getProveedorFiltered(search: string) {
    if (!search.trim()) return proveedores;
    const q = search.toLowerCase();
    return proveedores.filter(p => {
      const name = p.tipoPersona === 'NATURAL' ? `${p.nombres} ${p.apellidos}` : p.razonSocial || '';
      return name.toLowerCase().includes(q) || p.numeroDocumento.includes(q);
    });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    for (let i = 0; i < items.length; i++) {
      if (!items[i].productId) errs[`item-${i}-product`] = 'Seleccione un producto';
      if (items[i].quantity < 1) errs[`item-${i}-qty`] = 'Cantidad inválida';
      if (items[i].unitCost < 0) errs[`item-${i}-cost`] = 'Costo inválido';
    }
    if (items.length === 0) errs.general = 'Agregue al menos un producto';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({ facturaNumero: facturaNumero || undefined, terceroId: selectedProveedorId || undefined, fechaCompra, details: items });
    } finally {
      setSaving(false);
    }
  }

  const total = items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + item.quantity * (item.unitCost || product?.costoCompra || 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm sc-fade-in dark:bg-black/70">
      <form onSubmit={handleSubmit} className="sc-slide-up rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:shadow-black/40 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 mx-4">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          {tipo === 'COMPRA' ? 'Registrar Factura de Compra' : 'Registrar Pedido'}
        </h2>

        {errors.general && <p className="text-red-500 dark:text-red-400 text-xs mb-3">{errors.general}</p>}

        <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">N° Factura Proveedor</label>
            <input type="text" value={facturaNumero} onChange={e => setFacturaNumero(e.target.value)} placeholder="Opcional"
              className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Fecha de la Compra</label>
            <input type="date" value={fechaCompra} onChange={e => setFechaCompra(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div ref={proveedorRef} className="relative">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Proveedor</label>
            <input type="text" value={proveedorSearch} onChange={e => { setProveedorSearch(e.target.value); setSelectedProveedorId(''); setShowProveedorDropdown(true); }}
              onFocus={() => setShowProveedorDropdown(true)} placeholder="Buscar proveedor..." autoComplete="off"
              className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            {showProveedorDropdown && getProveedorFiltered(proveedorSearch).length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-36 overflow-y-auto">
                {getProveedorFiltered(proveedorSearch).map(p => (
                  <li key={p.id} onClick={() => selectProveedor(p)}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10">
                    {p.tipoPersona === 'NATURAL' ? `${p.nombres} ${p.apellidos}` : p.razonSocial} - {p.numeroDocumento}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => {
            const filtered = getFiltered(searchTexts[idx]);
            return (
              <div key={idx} className="flex flex-wrap gap-3 items-end border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                <div className="flex-1 relative" ref={el => { searchRefs.current[idx] = el; }}>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Producto</label>
                  <input type="text" placeholder="Buscar por código o nombre..." value={searchTexts[idx]}
                    onChange={e => updateSearch(idx, e.target.value)} onFocus={() => setOpenDropdown(idx)} autoComplete="off"
                    className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors[`item-${idx}-product`] ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                  {openDropdown === idx && filtered.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filtered.map(p => (
                        <li key={p.id} onClick={() => selectProduct(idx, p)}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 flex justify-between">
                          <span className="font-medium">{p.codigo}</span>
                          <span className="text-slate-500 dark:text-slate-400 ml-2">{p.nombre}</span>
                          <span className="text-slate-400 dark:text-slate-500 ml-auto">Stock: {p.stockActual}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="w-24">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Cantidad</label>
                  <input type="number" min={1} value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                    className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors[`item-${idx}-qty`] ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                </div>
                <div className="w-28">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Costo Unit.</label>
                  <input type="number" step="0.01" min={0} value={item.unitCost}
                    onChange={e => updateItem(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                    className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors[`item-${idx}-cost`] ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                </div>
                <div className="w-20 text-right">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Subtotal</label>
                  <p className="text-sm text-slate-800 dark:text-slate-100 py-2">${(item.quantity * (item.unitCost || 0)).toFixed(2)}</p>
                </div>
                <button type="button" onClick={() => removeItem(idx)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-lg cursor-pointer pb-1" title="Eliminar">×</button>
              </div>
            );
          })}
        </div>

        <button type="button" onClick={addItem} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium cursor-pointer">+ Agregar producto</button>

        <div className="flex justify-end mt-4 mb-6">
          <p className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">Total: ${total.toFixed(2)}</p>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-blue-500 hover:bg-slate-800 dark:hover:bg-blue-400 disabled:opacity-50 cursor-pointer">
            {saving ? 'Guardando...' : initialData ? 'Guardar Cambios' : tipo === 'COMPRA' ? 'Registrar Compra' : 'Registrar Pedido'}
          </button>
        </div>
      </form>
    </div>
  );
}
