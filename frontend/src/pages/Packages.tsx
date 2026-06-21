import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPackages, createPackage, updatePackage, deletePackage, sellPackage } from '../api/packageApi';
import { fetchProducts } from '../api/productApi';
import { fetchTerceros } from '../api/terceroApi';
import type { Package, CreatePackageDto } from '../types/package';
import type { Product } from '../types/product';
import type { Tercero } from '../types/tercero';

interface DetailLine {
  productId: string;
  quantity: number;
}

interface OperatingCostLine {
  concepto: string;
  valor: number;
}

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState(0);
  const [porcentajeMedico, setPorcentajeMedico] = useState(70);
  const [porcentajeCentro, setPorcentajeCentro] = useState(30);
  const [activo, setActivo] = useState(true);
  const [details, setDetails] = useState<DetailLine[]>([{ productId: '', quantity: 1 }]);
  const [operatingCosts, setOperatingCosts] = useState<OperatingCostLine[]>([]);
  const [searchTexts, setSearchTexts] = useState<string[]>(['']);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const searchRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sell modal
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellingPackage, setSellingPackage] = useState<Package | null>(null);
  const [clienteSearch, setClienteSearch] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const clienteRef = useRef<HTMLDivElement | null>(null);
  const [sellSaving, setSellSaving] = useState(false);
  const [sellResult, setSellResult] = useState<any>(null);

  // Delete confirm
  const [showDelete, setShowDelete] = useState<string | null>(null);

  const clientes = terceros.filter(t => (t.tipoRelacion === 'CLIENTE' || t.tipoRelacion === 'CLIENTE_PROVEEDOR') && t.activo);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (openDropdown !== null && searchRefs.current[openDropdown] && !searchRefs.current[openDropdown]!.contains(e.target as Node)) setOpenDropdown(null);
      if (clienteRef.current && !clienteRef.current.contains(e.target as Node)) setShowClienteDropdown(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [packagesData, productsData, tercerosData] = await Promise.all([
        fetchPackages(),
        fetchProducts(),
        fetchTerceros(),
      ]);
      setPackages(packagesData);
      setProducts(productsData);
      setTerceros(tercerosData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function getFiltered(search: string) {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return products.filter(p => p.activo && (p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)));
  }

  function selectProduct(idx: number, product: Product) {
    setDetails(details.map((d, i) => i === idx ? { ...d, productId: product.id } : d));
    setSearchTexts(searchTexts.map((t, i) => i === idx ? `${product.codigo} - ${product.nombre}` : t));
    setOpenDropdown(null);
  }

  function updateSearch(idx: number, value: string) {
    setSearchTexts(searchTexts.map((t, i) => i === idx ? value : t));
    setOpenDropdown(idx);
    if (!value.trim()) setDetails(details.map((d, i) => i === idx ? { ...d, productId: '' } : d));
  }

  function addDetail() {
    setDetails([...details, { productId: '', quantity: 1 }]);
    setSearchTexts([...searchTexts, '']);
  }

  function removeDetail(idx: number) {
    if (details.length <= 1) return;
    setDetails(details.filter((_, i) => i !== idx));
    setSearchTexts(searchTexts.filter((_, i) => i !== idx));
    if (openDropdown === idx) setOpenDropdown(null);
  }

  function addOperatingCost() {
    setOperatingCosts([...operatingCosts, { concepto: '', valor: 0 }]);
  }

  function removeOperatingCost(idx: number) {
    setOperatingCosts(operatingCosts.filter((_, i) => i !== idx));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!nombre.trim()) errs.nombre = 'El nombre es requerido';
    if (precio <= 0) errs.precio = 'El precio debe ser mayor a 0';
    if (porcentajeMedico + porcentajeCentro !== 100) errs.porcentaje = 'La suma de porcentajes debe ser 100%';
    for (let i = 0; i < details.length; i++) {
      if (!details[i].productId) errs[`detail-${i}-product`] = 'Seleccione un producto';
      if (details[i].quantity < 1) errs[`detail-${i}-qty`] = 'Cantidad inválida';
    }
    for (let i = 0; i < operatingCosts.length; i++) {
      if (!operatingCosts[i].concepto.trim()) errs[`cost-${i}-concept`] = 'Concepto requerido';
      if (operatingCosts[i].valor < 0) errs[`cost-${i}-value`] = 'Valor inválido';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function resetModal() {
    setShowModal(false);
    setEditingId(null);
    setNombre('');
    setDescripcion('');
    setPrecio(0);
    setPorcentajeMedico(70);
    setPorcentajeCentro(30);
    setActivo(true);
    setDetails([{ productId: '', quantity: 1 }]);
    setOperatingCosts([]);
    setSearchTexts(['']);
    setErrors({});
  }

  function openEdit(pkg: Package) {
    setEditingId(pkg.id);
    setNombre(pkg.nombre);
    setDescripcion(pkg.descripcion || '');
    setPrecio(pkg.precio);
    setPorcentajeMedico(pkg.porcentajeMedico);
    setPorcentajeCentro(pkg.porcentajeCentro);
    setActivo(pkg.activo);
    setDetails(pkg.details?.map(d => ({ productId: d.productId, quantity: d.quantity })) || [{ productId: '', quantity: 1 }]);
    setOperatingCosts(pkg.operatingCosts?.map(oc => ({ concepto: oc.concepto, valor: oc.valor })) || []);
    setSearchTexts(pkg.details?.map(d => {
      const p = products.find(pr => pr.id === d.productId);
      return p ? `${p.codigo} - ${p.nombre}` : '';
    }) || ['']);
    setErrors({});
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const dto: CreatePackageDto = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        precio,
        porcentajeMedico,
        porcentajeCentro,
        activo,
        details: details.filter(d => d.productId).map(d => ({ productId: d.productId, quantity: d.quantity })),
        operatingCosts: operatingCosts.filter(oc => oc.concepto.trim()).map(oc => ({ concepto: oc.concepto.trim(), valor: oc.valor })),
      };
      if (editingId) {
        await updatePackage(editingId, dto);
      } else {
        await createPackage(dto);
      }
      resetModal();
      load();
    } catch (e: any) { setErrors({ general: e.message }); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await deletePackage(id);
      setShowDelete(null);
      load();
    } catch (e) { console.error(e); }
  }

  async function openSell(pkg: Package) {
    setSellingPackage(pkg);
    setClienteSearch('');
    setSelectedClienteId('');
    setShowSellModal(true);
    setSellResult(null);
  }

  async function handleSell() {
    if (!sellingPackage) return;
    setSellSaving(true);
    try {
      const result = await sellPackage(sellingPackage.id, selectedClienteId || undefined);
      setSellResult(result);
    } catch (e: any) { setErrors({ sell: e.message }); }
    finally { setSellSaving(false); }
  }

  function selectCliente(t: Tercero) {
    setSelectedClienteId(t.id);
    setClienteSearch(t.tipoPersona === 'NATURAL' ? `${t.nombres} ${t.apellidos}` : t.razonSocial || '');
    setShowClienteDropdown(false);
  }

  const costoMedicamentosCalc = details.reduce((sum, d) => {
    const p = products.find(pr => pr.id === d.productId);
    return sum + (p ? p.costoCompra * d.quantity : 0);
  }, 0);

  const costoOperativoCalc = operatingCosts.reduce((sum, oc) => sum + (oc.valor || 0), 0);
  const costoTotalCalc = costoMedicamentosCalc + costoOperativoCalc;
  const utilidadCalc = precio - costoTotalCalc;
  const gananciaMedicoCalc = utilidadCalc * (porcentajeMedico / 100);
  const gananciaCentroCalc = utilidadCalc * (porcentajeCentro / 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Paquetes</h2>
        <button onClick={() => { resetModal(); setShowModal(true); }} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer">
          + Nuevo Paquete
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : packages.length === 0 ? (
        <p className="text-gray-400 text-sm">No hay paquetes registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Precio Venta</th>
                <th className="px-4 py-3 font-medium">Costo Med.</th>
                <th className="px-4 py-3 font-medium">Costo Ope.</th>
                <th className="px-4 py-3 font-medium">Costo Total</th>
                <th className="px-4 py-3 font-medium">Utilidad</th>
                <th className="px-4 py-3 font-medium">% Médico</th>
                <th className="px-4 py-3 font-medium">% Centro</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.map(pkg => {
                const cm = pkg.details?.reduce((s, d) => {
                  const p = products.find(pr => pr.id === d.productId);
                  return s + (p ? p.costoCompra * d.quantity : 0);
                }, 0) || 0;
                const co = pkg.operatingCosts?.reduce((s, oc) => s + oc.valor, 0) || 0;
                const ct = cm + co;
                const u = pkg.precio - ct;
                return (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800 font-medium">{pkg.nombre}</td>
                    <td className="px-4 py-3 text-gray-700">${pkg.precio.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-500">${cm.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-500">${co.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-500">${ct.toFixed(2)}</td>
                    <td className={`px-4 py-3 font-medium ${u >= 0 ? 'text-green-600' : 'text-red-600'}`}>${u.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-500">{pkg.porcentajeMedico}%</td>
                    <td className="px-4 py-3 text-gray-500">{pkg.porcentajeCentro}%</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${pkg.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {pkg.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openSell(pkg)} disabled={!pkg.activo}
                          className={`text-xs px-2 py-1 rounded border ${pkg.activo ? 'border-green-300 text-green-600 hover:bg-green-50 cursor-pointer' : 'border-gray-200 text-gray-300'}`}>Vender</button>
                        <button onClick={() => openEdit(pkg)}
                          className="text-xs px-2 py-1 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 cursor-pointer">Editar</button>
                        <button onClick={() => setShowDelete(pkg.id)}
                          className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 cursor-pointer">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={handleSave} className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">{editingId ? 'Editar Paquete' : 'Nuevo Paquete'}</h2>
            {errors.general && <p className="text-red-500 text-xs mb-3">{errors.general}</p>}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Nombre</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors.nombre ? 'border-red-400' : 'border-gray-300'}`} />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Precio de Venta</label>
                <input type="number" step="0.01" min={0} value={precio} onChange={e => setPrecio(parseFloat(e.target.value) || 0)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors.precio ? 'border-red-400' : 'border-gray-300'}`} />
                {errors.precio && <p className="text-red-500 text-xs mt-1">{errors.precio}</p>}
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Descripción</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">% Médico</label>
                <input type="number" min={0} max={100} value={porcentajeMedico} onChange={e => setPorcentajeMedico(parseInt(e.target.value) || 0)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors.porcentaje ? 'border-red-400' : 'border-gray-300'}`} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">% Centro</label>
                <input type="number" min={0} max={100} value={porcentajeCentro} onChange={e => setPorcentajeCentro(parseInt(e.target.value) || 0)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors.porcentaje ? 'border-red-400' : 'border-gray-300'}`} />
                {errors.porcentaje && <p className="text-red-500 text-xs mt-1">{errors.porcentaje}</p>}
              </div>
            </div>

            {/* Products (Package Details) */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">Productos del Paquete</label>
                <button type="button" onClick={addDetail} className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer">+ Agregar producto</button>
              </div>
              <div className="space-y-2">
                {details.map((detail, idx) => {
                  const filtered = getFiltered(searchTexts[idx]);
                  return (
                    <div key={idx} className="flex gap-3 items-end border border-gray-200 rounded-lg p-2">
                      <div className="flex-1 relative" ref={el => { searchRefs.current[idx] = el; }}>
                        <input type="text" placeholder="Buscar producto..." value={searchTexts[idx]} onChange={e => updateSearch(idx, e.target.value)} onFocus={() => setOpenDropdown(idx)} autoComplete="off"
                          className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors[`detail-${idx}-product`] ? 'border-red-400' : 'border-gray-300'}`} />
                        {openDropdown === idx && filtered.length > 0 && (
                          <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                            {filtered.map(p => (
                              <li key={p.id} onClick={() => selectProduct(idx, p)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex justify-between">
                                <span>{p.codigo} - {p.nombre}</span>
                                <span className="text-gray-400">Stock: {p.stockActual}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="w-20">
                        <input type="number" min={1} value={detail.quantity} onChange={e => setDetails(details.map((d, i) => i === idx ? { ...d, quantity: parseInt(e.target.value) || 0 } : d))}
                          className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors[`detail-${idx}-qty`] ? 'border-red-400' : 'border-gray-300'}`} />
                      </div>
                      <button type="button" onClick={() => removeDetail(idx)} className="text-red-500 hover:text-red-700 text-lg cursor-pointer pb-1">×</button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operating Costs */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">Costos Operativos</label>
                <button type="button" onClick={addOperatingCost} className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer">+ Agregar costo</button>
              </div>
              {operatingCosts.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Sin costos operativos registrados</p>
              ) : (
                <div className="space-y-2">
                  {operatingCosts.map((oc, idx) => (
                    <div key={idx} className="flex gap-3 items-end border border-gray-200 rounded-lg p-2">
                      <div className="flex-1">
                        <input type="text" placeholder="Concepto (ej: Aplicación enfermería)" value={oc.concepto} onChange={e => setOperatingCosts(operatingCosts.map((c, i) => i === idx ? { ...c, concepto: e.target.value } : c))}
                          className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors[`cost-${idx}-concept`] ? 'border-red-400' : 'border-gray-300'}`} />
                      </div>
                      <div className="w-28">
                        <input type="number" step="0.01" min={0} placeholder="Valor" value={oc.valor} onChange={e => setOperatingCosts(operatingCosts.map((c, i) => i === idx ? { ...c, valor: parseFloat(e.target.value) || 0 } : c))}
                          className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors[`cost-${idx}-value`] ? 'border-red-400' : 'border-gray-300'}`} />
                      </div>
                      <button type="button" onClick={() => removeOperatingCost(idx)} className="text-red-500 hover:text-red-700 text-lg cursor-pointer pb-1">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profitability Preview */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Vista Previa de Rentabilidad</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Costo Medicamentos:</span>
                  <p className="font-medium">${costoMedicamentosCalc.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Costo Operativo:</span>
                  <p className="font-medium">${costoOperativoCalc.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Costo Total:</span>
                  <p className="font-medium">${costoTotalCalc.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Utilidad:</span>
                  <p className={`font-bold ${utilidadCalc >= 0 ? 'text-green-600' : 'text-red-600'}`}>${utilidadCalc.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Ganancia Médico ({porcentajeMedico}%):</span>
                  <p className="font-medium text-blue-600">${gananciaMedicoCalc.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Ganancia Centro ({porcentajeCentro}%):</span>
                  <p className="font-medium text-purple-600">${gananciaCentroCalc.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center mb-4">
              <input type="checkbox" id="activo" checked={activo} onChange={e => setActivo(e.target.checked)} className="mr-2" />
              <label htmlFor="activo" className="text-sm text-gray-600">Activo</label>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetModal} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && sellingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
            <h2 className="text-xl font-bold mb-2 text-gray-800">Vender Paquete</h2>
            <p className="text-sm text-gray-600 mb-4">{sellingPackage.nombre} - ${sellingPackage.precio.toFixed(2)}</p>

            {sellResult ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-700 font-medium text-sm mb-2">Venta registrada exitosamente</p>
                <p className="text-xs text-gray-600">Comprobante: #{String(sellResult.consecutivo).padStart(6, '0')}</p>
                {sellResult.packageProfitability && (
                  <div className="mt-2 text-xs space-y-1">
                    <p>Costo Medicamentos: ${sellResult.packageProfitability.costoMedicamentos.toFixed(2)}</p>
                    <p>Costo Operativo: ${sellResult.packageProfitability.costoOperativo.toFixed(2)}</p>
                    <p>Costo Total: ${sellResult.packageProfitability.costoTotal.toFixed(2)}</p>
                    <p className="font-bold text-green-700">Utilidad: ${sellResult.packageProfitability.utilidad.toFixed(2)}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {errors.sell && <p className="text-red-500 text-xs mb-3">{errors.sell}</p>}
                <div ref={clienteRef} className="relative mb-4">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Cliente (opcional)</label>
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
              </>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => { setShowSellModal(false); setSellResult(null); }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">
                {sellResult ? 'Cerrar' : 'Cancelar'}
              </button>
              {!sellResult && (
                <button onClick={handleSell} disabled={sellSaving}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer">
                  {sellSaving ? 'Vendiendo...' : 'Confirmar Venta'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 mx-4">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Eliminar Paquete</h2>
            <p className="text-sm text-gray-500 mb-4">¿Está seguro de eliminar este paquete? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDelete(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">Cancelar</button>
              <button onClick={() => handleDelete(showDelete)} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
