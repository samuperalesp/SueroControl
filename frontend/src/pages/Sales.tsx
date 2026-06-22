import { useState, useEffect, useCallback, useRef } from 'react';
import type { Sale, ComprobanteData } from '../types/sale';
import type { Product } from '../types/product';
import type { Tercero } from '../types/tercero';
import type { Package } from '../types/package';
import { fetchSales, createSale, updateSale, cancelSale, fetchComprobante } from '../api/saleApi';
import { fetchProducts } from '../api/productApi';
import { fetchPackages } from '../api/packageApi';
import { fetchTerceros } from '../api/terceroApi';

interface LineItem {
  type: 'PRODUCT' | 'PACKAGE';
  productId?: string;
  packageId?: string;
  quantity: number;
  unitPrice: number;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(true);

  // Search / filter
  const [searchCons, setSearchCons] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [items, setItems] = useState<LineItem[]>([{ type: 'PRODUCT', productId: '', quantity: 1, unitPrice: 0 }]);
  const [searchTexts, setSearchTexts] = useState<string[]>(['']);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const searchRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [clienteSearch, setClienteSearch] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const clienteRef = useRef<HTMLDivElement | null>(null);
  const [medicoSearch, setMedicoSearch] = useState('');
  const [selectedMedicoId, setSelectedMedicoId] = useState('');
  const [showMedicoDropdown, setShowMedicoDropdown] = useState(false);
  const medicoRef = useRef<HTMLDivElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editClienteSearch, setEditClienteSearch] = useState('');
  const [editSelectedClienteId, setEditSelectedClienteId] = useState('');
  const [editShowDropdown, setEditShowDropdown] = useState(false);
  const editClienteRef = useRef<HTMLDivElement | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Cancel modal
  const [showCancel, setShowCancel] = useState(false);
  const [cancellingSale, setCancellingSale] = useState<Sale | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [cancelSaving, setCancelSaving] = useState(false);
  const [cancelErrors, setCancelErrors] = useState('');

  // Comprobante modal
  const [showComprobante, setShowComprobante] = useState(false);
  const [comprobanteData, setComprobanteData] = useState<ComprobanteData | null>(null);
  const [comprobanteLoading, setComprobanteLoading] = useState(false);

  const clientes = terceros.filter(t => (t.tipoRelacion === 'CLIENTE' || t.tipoRelacion === 'CLIENTE_PROVEEDOR') && t.activo);
  const medicos = terceros.filter(t => t.tipoRelacion === 'MEDICO' && t.activo);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (openDropdown !== null && searchRefs.current[openDropdown] && !searchRefs.current[openDropdown]!.contains(e.target as Node)) setOpenDropdown(null);
      if (clienteRef.current && !clienteRef.current.contains(e.target as Node)) setShowClienteDropdown(false);
      if (medicoRef.current && !medicoRef.current.contains(e.target as Node)) setShowMedicoDropdown(false);
      if (editClienteRef.current && !editClienteRef.current.contains(e.target as Node)) setEditShowDropdown(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const load = useCallback(async (cons?: string, cli?: string, from?: string, to?: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (cons) params.consecutivo = parseInt(cons);
      if (from) params.fechaDesde = from;
      if (to) params.fechaHasta = to;
      const [salesData, productsData, packagesData, tercerosData] = await Promise.all([
        fetchSales(Object.keys(params).length ? params : undefined),
        fetchProducts(),
        fetchPackages(),
        fetchTerceros(),
      ]);
      let filtered = salesData;
      if (cli) {
        const q = cli.toLowerCase();
        const matchingIds = tercerosData
          .filter(t => {
            const name = t.tipoPersona === 'NATURAL' ? `${t.nombres} ${t.apellidos}` : t.razonSocial || '';
            return name.toLowerCase().includes(q) || t.numeroDocumento.includes(q);
          })
          .map(t => t.id);
        filtered = salesData.filter(s => s.terceroId && matchingIds.includes(s.terceroId));
      }
      setSales(filtered);
      setProducts(productsData);
      setPackages(packagesData);
      setTerceros(tercerosData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function getFilteredProducts(search: string) {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return products.filter(p => p.activo && (p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)));
  }

  function getFilteredPackages(search: string) {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return packages.filter(p => p.activo && p.nombre.toLowerCase().includes(q));
  }

  function selectProduct(idx: number, product: Product) {
    setItems(items.map((item, i) =>
      i === idx ? { ...item, type: 'PRODUCT', productId: product.id, packageId: undefined, unitPrice: product.precioVenta } : item
    ));
    setSearchTexts(searchTexts.map((t, i) => i === idx ? `${product.codigo} - ${product.nombre}` : t));
    setOpenDropdown(null);
  }

  function selectPackage(idx: number, pkg: Package) {
    setItems(items.map((item, i) =>
      i === idx ? { ...item, type: 'PACKAGE', packageId: pkg.id, productId: undefined, unitPrice: pkg.precio } : item
    ));
    setSearchTexts(searchTexts.map((t, i) => i === idx ? pkg.nombre : t));
    setOpenDropdown(null);
  }

  function updateSearch(idx: number, value: string) {
    setSearchTexts(searchTexts.map((t, i) => i === idx ? value : t));
    setOpenDropdown(idx);
    if (!value.trim()) setItems(items.map((item, i) => i === idx ? { ...item, type: 'PRODUCT', productId: undefined, packageId: undefined } : item));
  }

  function setItemType(idx: number, type: 'PRODUCT' | 'PACKAGE') {
    setItems(items.map((item, i) =>
      i === idx ? { type, productId: undefined, packageId: undefined, quantity: 1, unitPrice: 0 } : item
    ));
    setSearchTexts(searchTexts.map((t, i) => i === idx ? '' : t));
    setOpenDropdown(null);
  }

  function addItem() { setItems([...items, { type: 'PRODUCT', productId: '', quantity: 1, unitPrice: 0 }]); setSearchTexts([...searchTexts, '']); }
  function removeItem(idx: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
    setSearchTexts(searchTexts.filter((_, i) => i !== idx));
    if (openDropdown === idx) setOpenDropdown(null);
  }

  function selectCliente(t: Tercero) {
    setSelectedClienteId(t.id);
    setClienteSearch(t.tipoPersona === 'NATURAL' ? `${t.nombres} ${t.apellidos}` : t.razonSocial || '');
    setShowClienteDropdown(false);
  }

  function selectMedico(t: Tercero) {
    setSelectedMedicoId(t.id);
    setMedicoSearch(`${t.nombres} ${t.apellidos}`);
    setShowMedicoDropdown(false);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!selectedMedicoId) errs.medico = 'Seleccione un médico';
    for (let i = 0; i < items.length; i++) {
      if (items[i].type === 'PRODUCT' && !items[i].productId) errs[`item-${i}-product`] = 'Seleccione un producto';
      if (items[i].type === 'PACKAGE' && !items[i].packageId) errs[`item-${i}-product`] = 'Seleccione un paquete';
      if (items[i].quantity < 1) errs[`item-${i}-qty`] = 'Cantidad inválida';
      if (items[i].unitPrice < 0) errs[`item-${i}-price`] = 'Precio inválido';
    }
    if (items.length === 0) errs.general = 'Agregue al menos un producto o paquete';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await createSale({ terceroId: selectedClienteId || undefined, medicoId: selectedMedicoId, details: items });
      resetCreateModal();
      load();
    } catch (e: any) { setErrors({ general: e.message }); }
    finally { setSaving(false); }
  }

  function resetCreateModal() {
    setShowCreate(false);
    setItems([{ type: 'PRODUCT', productId: '', quantity: 1, unitPrice: 0 }]);
    setSearchTexts(['']);
    setClienteSearch('');
    setSelectedClienteId('');
    setMedicoSearch('');
    setSelectedMedicoId('');
    setErrors({});
  }

  function openEdit(sale: Sale) {
    setEditingSale(sale);
    if (sale.terceroId) {
      const t = terceros.find(te => te.id === sale.terceroId);
      if (t) {
        setEditSelectedClienteId(t.id);
        setEditClienteSearch(t.tipoPersona === 'NATURAL' ? `${t.nombres} ${t.apellidos}` : t.razonSocial || '');
      }
    } else {
      setEditSelectedClienteId('');
      setEditClienteSearch('');
    }
    setEditErrors({});
    setShowEdit(true);
  }

  function selectEditCliente(t: Tercero) {
    setEditSelectedClienteId(t.id);
    setEditClienteSearch(t.tipoPersona === 'NATURAL' ? `${t.nombres} ${t.apellidos}` : t.razonSocial || '');
    setEditShowDropdown(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSale) return;
    if (editSelectedClienteId === editingSale.terceroId) {
      setShowEdit(false); return;
    }
    setEditSaving(true);
    try {
      await updateSale(editingSale.id, { terceroId: editSelectedClienteId || undefined });
      setShowEdit(false);
      load();
    } catch (e: any) { setEditErrors({ general: e.message }); }
    finally { setEditSaving(false); }
  }

  function openCancel(sale: Sale) {
    setCancellingSale(sale);
    setCancelMotivo('');
    setCancelErrors('');
    setShowCancel(true);
  }

  async function handleCancel() {
    if (!cancellingSale || !cancelMotivo.trim()) {
      setCancelErrors('Debe indicar un motivo de anulación');
      return;
    }
    setCancelSaving(true);
    try {
      await cancelSale(cancellingSale.id, { motivo: cancelMotivo });
      setShowCancel(false);
      load();
    } catch (e: any) { setCancelErrors(e.message); }
    finally { setCancelSaving(false); }
  }

  async function openComprobante(sale: Sale) {
    setComprobanteLoading(true);
    setShowComprobante(true);
    try {
      const data = await fetchComprobante(sale.id);
      setComprobanteData(data);
    } catch (e) {
      console.error(e);
      setShowComprobante(false);
    } finally {
      setComprobanteLoading(false);
    }
  }

  const createTotal = items.reduce((sum, item) => {
    if (item.type === 'PRODUCT') {
      const product = products.find(p => p.id === item.productId);
      return sum + item.quantity * (item.unitPrice || product?.precioVenta || 0);
    }
    if (item.type === 'PACKAGE') {
      const pkg = packages.find(p => p.id === item.packageId);
      return sum + item.quantity * (item.unitPrice || pkg?.precio || 0);
    }
    return sum;
  }, 0);

  function getItemName(id: string | undefined, type?: string) {
    if (!id) return '-';
    if (type === 'PACKAGE') {
      return packages.find(p => p.id === id)?.nombre || id;
    }
    const p = products.find(p => p.id === id);
    return p ? `${p.codigo} - ${p.nombre}` : id;
  }

  function getPackageComponents(pkgId: string | undefined) {
    if (!pkgId) return [];
    const pkg = packages.find(p => p.id === pkgId);
    return pkg?.details || [];
  }

  function getClienteName(sale: Sale) {
    if (!sale.terceroId) return '-';
    const t = terceros.find(te => te.id === sale.terceroId);
    if (!t) return sale.terceroId;
    return t.tipoPersona === 'NATURAL' ? `${t.nombres} ${t.apellidos}` : t.razonSocial || '';
  }

  function getClienteDoc(sale: Sale) {
    if (!sale.terceroId) return '';
    const t = terceros.find(te => te.id === sale.terceroId);
    if (!t) return '';
    return `${t.tipoDocumento} ${t.numeroDocumento}${t.digitoVerificacion ? '-' + t.digitoVerificacion : ''}`;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Ventas</h2>
        <button onClick={() => { resetCreateModal(); setShowCreate(true); }} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer">
          + Nueva Venta
        </button>
      </div>

      {/* Search bar */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Consecutivo</label>
          <input type="number" min={1} value={searchCons} onChange={e => setSearchCons(e.target.value)} placeholder="#"
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Cliente</label>
          <input type="text" value={searchCliente} onChange={e => setSearchCliente(e.target.value)} placeholder="Nombre o documento"
            className="w-44 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Desde</label>
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Hasta</label>
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <button onClick={() => load(searchCons, searchCliente, fechaDesde, fechaHasta)}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 cursor-pointer">
          Buscar
        </button>
        <button onClick={() => { setSearchCons(''); setSearchCliente(''); setFechaDesde(''); setFechaHasta(''); load(); }}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 cursor-pointer">
          Limpiar
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : sales.length === 0 ? (
        <p className="text-gray-400 text-sm">No hay ventas registradas.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Comprobante</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Médico</th>
                <th className="px-4 py-3 font-medium">Productos</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800 font-medium">#{String(s.consecutivo).padStart(6, '0')}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-800">
                    <div>{getClienteName(s)}</div>
                    <div className="text-xs text-gray-400">{getClienteDoc(s)}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    {s.medicoId ? (() => { const m = terceros.find(t => t.id === s.medicoId); return m ? `${m.nombres} ${m.apellidos}` : s.medicoId; })() : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.details?.map(d => {
                      if (d.packageId) return `${getItemName(d.packageId, 'PACKAGE')} x${d.quantity}`;
                      return `${getItemName(d.productId)} x${d.quantity}`;
                    }).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">${s.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.estado === 'ACTIVA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {s.estado === 'ACTIVA' ? 'Activa' : 'Anulada'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} disabled={s.estado !== 'ACTIVA'}
                        className={`text-xs px-2 py-1 rounded border ${
                          s.estado === 'ACTIVA' ? 'border-blue-300 text-blue-600 hover:bg-blue-50 cursor-pointer' : 'border-gray-200 text-gray-300'
                        }`}>Editar</button>
                      <button onClick={() => openCancel(s)} disabled={s.estado !== 'ACTIVA'}
                        className={`text-xs px-2 py-1 rounded border ${
                          s.estado === 'ACTIVA' ? 'border-red-300 text-red-600 hover:bg-red-50 cursor-pointer' : 'border-gray-200 text-gray-300'
                        }`}>Anular</button>
                      <button onClick={() => openComprobante(s)}
                        className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer">Comprobante</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Nueva Venta</h2>
            {errors.general && <p className="text-red-500 text-xs mb-3">{errors.general}</p>}

            <div ref={clienteRef} className="relative mb-4">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Cliente</label>
              <input type="text" value={clienteSearch} onChange={e => { setClienteSearch(e.target.value); setSelectedClienteId(''); setShowClienteDropdown(true); }}
                onFocus={() => setShowClienteDropdown(true)} placeholder="Buscar cliente..." autoComplete="off"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              {showClienteDropdown && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                  {clientes.filter(c => {
                    const name = c.tipoPersona === 'NATURAL' ? `${c.nombres} ${c.apellidos}` : c.razonSocial || '';
                    return name.toLowerCase().includes(clienteSearch.toLowerCase()) || c.numeroDocumento.includes(clienteSearch);
                  }).map(c => (
                    <li key={c.id} onClick={() => selectCliente(c)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50">
                      {c.tipoPersona === 'NATURAL' ? `${c.nombres} ${c.apellidos}` : c.razonSocial} - {c.numeroDocumento}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div ref={medicoRef} className="relative mb-4">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Médico <span className="text-red-500">*</span></label>
              <input type="text" value={medicoSearch} onChange={e => { setMedicoSearch(e.target.value); setSelectedMedicoId(''); setShowMedicoDropdown(true); }}
                onFocus={() => setShowMedicoDropdown(true)} placeholder="Buscar médico..." autoComplete="off"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors.medico ? 'border-red-400' : 'border-gray-300'}`} />
              {errors.medico && <p className="text-xs text-red-500 mt-1">{errors.medico}</p>}
              {showMedicoDropdown && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                  {medicos.filter(m => {
                    const name = `${m.nombres} ${m.apellidos}`;
                    return name.toLowerCase().includes(medicoSearch.toLowerCase()) || m.numeroDocumento.includes(medicoSearch) || (m.registroProfesional || '').includes(medicoSearch);
                  }).map(m => (
                    <li key={m.id} onClick={() => selectMedico(m)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50">
                      {m.nombres} {m.apellidos} - {m.numeroDocumento} {m.registroProfesional ? `(Reg: ${m.registroProfesional})` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const productFiltered = getFilteredProducts(searchTexts[idx]);
                const packageFiltered = getFilteredPackages(searchTexts[idx]);
                const selectedPackage = item.packageId ? packages.find(p => p.id === item.packageId) : null;
                const components = selectedPackage ? getPackageComponents(item.packageId) : [];
                return (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex gap-2 mb-2">
                      <button type="button" onClick={() => setItemType(idx, 'PRODUCT')}
                        className={`text-xs px-3 py-1 rounded-full font-medium cursor-pointer ${item.type === 'PRODUCT' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        Producto
                      </button>
                      <button type="button" onClick={() => setItemType(idx, 'PACKAGE')}
                        className={`text-xs px-3 py-1 rounded-full font-medium cursor-pointer ${item.type === 'PACKAGE' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        Paquete
                      </button>
                    </div>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1 relative" ref={el => { searchRefs.current[idx] = el; }}>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                          {item.type === 'PRODUCT' ? 'Producto' : 'Paquete'}
                        </label>
                        <input type="text"
                          placeholder={item.type === 'PRODUCT' ? 'Buscar por código o nombre...' : 'Buscar paquete por nombre...'}
                          value={searchTexts[idx]}
                          onChange={e => updateSearch(idx, e.target.value)}
                          onFocus={() => setOpenDropdown(idx)}
                          autoComplete="off"
                          className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors[`item-${idx}-product`] ? 'border-red-400' : 'border-gray-300'}`} />
                        {openDropdown === idx && item.type === 'PRODUCT' && productFiltered.length > 0 && (
                          <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {productFiltered.map(p => (
                              <li key={p.id} onClick={() => selectProduct(idx, p)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex justify-between">
                                <span className="font-medium">{p.codigo}</span>
                                <span className="text-gray-500 ml-2">{p.nombre}</span>
                                <span className="text-gray-400 ml-auto">Stock: {p.stockActual}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {openDropdown === idx && item.type === 'PACKAGE' && packageFiltered.length > 0 && (
                          <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {packageFiltered.map(p => (
                              <li key={p.id} onClick={() => selectPackage(idx, p)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex justify-between">
                                <span className="font-medium">{p.nombre}</span>
                                <span className="text-gray-400 ml-auto">${p.precio.toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="w-24">
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Cantidad</label>
                        <input type="number" min={1} value={item.quantity} onChange={e => setItems(items.map((it, i) => i === idx ? { ...it, quantity: parseInt(e.target.value) || 0 } : it))}
                          className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors[`item-${idx}-qty`] ? 'border-red-400' : 'border-gray-300'}`} />
                      </div>
                      <div className="w-28">
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Precio Unit.</label>
                        <input type="number" step="0.01" min={0} value={item.unitPrice} onChange={e => setItems(items.map((it, i) => i === idx ? { ...it, unitPrice: parseFloat(e.target.value) || 0 } : it))}
                          className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors[`item-${idx}-price`] ? 'border-red-400' : 'border-gray-300'}`} />
                      </div>
                      <div className="w-20 text-right">
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Subtotal</label>
                        <p className="text-sm text-gray-800 py-2">${(item.quantity * (item.unitPrice || 0)).toFixed(2)}</p>
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 text-lg cursor-pointer pb-1">×</button>
                    </div>
                    {item.type === 'PACKAGE' && components.length > 0 && (
                      <div className="mt-2 ml-1">
                        <p className="text-xs font-medium text-gray-500 mb-1">Componentes del paquete:</p>
                        <div className="flex flex-wrap gap-2">
                          {components.map((comp, ci) => {
                            const prod = products.find(p => p.id === comp.productId);
                            return (
                              <span key={ci} className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-600">
                                {prod ? `${prod.nombre}` : comp.productId} x{comp.quantity * item.quantity}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={addItem} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer">+ Agregar producto</button>
            <div className="flex justify-end mt-4 mb-6">
              <p className="text-lg font-bold text-gray-800">Total: ${createTotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetCreateModal} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                {saving ? 'Guardando...' : 'Registrar Venta'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={handleEdit} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Editar Venta #{String(editingSale.consecutivo).padStart(6, '0')}</h2>
            {editErrors.general && <p className="text-red-500 text-xs mb-3">{editErrors.general}</p>}

            <div ref={editClienteRef} className="relative mb-4">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Cliente</label>
              <input type="text" value={editClienteSearch} onChange={e => { setEditClienteSearch(e.target.value); setEditSelectedClienteId(''); setEditShowDropdown(true); }}
                onFocus={() => setEditShowDropdown(true)} placeholder="Buscar cliente..." autoComplete="off"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              {editShowDropdown && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                  {clientes.filter(c => {
                    const name = c.tipoPersona === 'NATURAL' ? `${c.nombres} ${c.apellidos}` : c.razonSocial || '';
                    return name.toLowerCase().includes(editClienteSearch.toLowerCase()) || c.numeroDocumento.includes(editClienteSearch);
                  }).map(c => (
                    <li key={c.id} onClick={() => selectEditCliente(c)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50">
                      {c.tipoPersona === 'NATURAL' ? `${c.nombres} ${c.apellidos}` : c.razonSocial} - {c.numeroDocumento}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={editSaving} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                {editSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancel && cancellingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Anular Venta #{String(cancellingSale.consecutivo).padStart(6, '0')}</h2>
            <p className="text-sm text-gray-500 mb-4">Esta acción devolverá el stock de todos los productos. No se puede deshacer.</p>
            {cancelErrors && <p className="text-red-500 text-xs mb-3">{cancelErrors}</p>}
            <label className="text-xs font-medium text-gray-600 mb-1 block">Motivo de anulación</label>
            <textarea value={cancelMotivo} onChange={e => setCancelMotivo(e.target.value)} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400 mb-4"
              placeholder="Indique el motivo..." />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCancel(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">Cancelar</button>
              <button onClick={handleCancel} disabled={cancelSaving || !cancelMotivo.trim()}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer">
                {cancelSaving ? 'Anulando...' : 'Anular Venta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprobante Modal */}
      {showComprobante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 mx-4">
            {comprobanteLoading ? (
              <p className="text-gray-400 text-sm">Cargando comprobante...</p>
            ) : comprobanteData ? (
              <div id="comprobante-content">
                <div className="text-center mb-6 pb-4 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800">SueroControl</h2>
                  <p className="text-xs text-gray-400">Sistema de Inventario</p>
                  <h3 className="text-xl font-bold text-gray-800 mt-2">Comprobante de Venta</h3>
                  <p className="text-sm text-gray-600 font-medium">{comprobanteData.comprobante}</p>
                </div>

                <div className="text-sm space-y-1 mb-4">
                  <p><span className="text-gray-500">Fecha:</span> {new Date(comprobanteData.fecha).toLocaleString()}</p>
                  {comprobanteData.estado === 'ANULADA' && (
                    <p><span className="text-red-600 font-medium">ANULADA</span> {comprobanteData.anuladaMotivo && `- ${comprobanteData.anuladaMotivo}`}</p>
                  )}
                  {comprobanteData.cliente && (
                    <>
                      <p><span className="text-gray-500">Cliente:</span> {comprobanteData.cliente.nombre}</p>
                      <p><span className="text-gray-500">Documento:</span> {comprobanteData.cliente.documento}</p>
                      {comprobanteData.cliente.direccion && <p><span className="text-gray-500">Dirección:</span> {comprobanteData.cliente.direccion}</p>}
                      {comprobanteData.cliente.telefono && <p><span className="text-gray-500">Teléfono:</span> {comprobanteData.cliente.telefono}</p>}
                    </>
                  )}
                </div>

                <table className="w-full text-sm mb-4">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="text-left px-2 py-2">Producto</th>
                      <th className="text-center px-2 py-2">Cant.</th>
                      <th className="text-right px-2 py-2">P.Unit</th>
                      <th className="text-right px-2 py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {comprobanteData.items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-2 py-2">{item.producto}</td>
                        <td className="text-center px-2 py-2">{item.cantidad}</td>
                        <td className="text-right px-2 py-2">${item.precioUnitario.toFixed(2)}</td>
                        <td className="text-right px-2 py-2">${item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold text-gray-800">
                      <td colSpan={3} className="text-right px-2 py-3">Total:</td>
                      <td className="text-right px-2 py-3">${comprobanteData.total.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
                  <button onClick={() => window.print()}
                    className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm hover:bg-gray-800 cursor-pointer">Imprimir</button>
                  <button onClick={() => setShowComprobante(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">Cerrar</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
