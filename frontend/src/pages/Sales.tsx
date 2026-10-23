import { useState, useEffect, useCallback, useRef } from 'react';
import type { Sale, ComprobanteData, PackageSession, UpdateSaleDto } from '../types/sale';
import type { Product } from '../types/product';
import type { Tercero } from '../types/tercero';
import type { Package } from '../types/package';
import { fetchSales, createSale, updateSale, cancelSale, fetchComprobante, fetchPackageSessions, createPackageSession, applyPackageSession, cancelPackageSession } from '../api/saleApi';
import { fetchProducts } from '../api/productApi';
import { fetchPackages } from '../api/packageApi';
import { fetchTerceros } from '../api/terceroApi';
import { useWarehouse } from '../context/WarehouseContext';

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

type LineItemType = 'PRODUCT' | 'PACKAGE' | 'PACKAGE_SESSION';

interface LineItem {
  type: LineItemType;
  productId?: string;
  packageId?: string;
  quantity: number;
  unitPrice: number;
  sessions?: number;
  discountPercent?: number;
}

type Tab = 'ventas' | 'paquetes-sesiones' | 'aplicaciones';

export default function Sales() {
  const { selectedWarehouseId } = useWarehouse();
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
  const [fechaVenta, setFechaVenta] = useState(new Date().toISOString().split('T')[0]);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editClienteSearch, setEditClienteSearch] = useState('');
  const [editSelectedClienteId, setEditSelectedClienteId] = useState('');
  const [editShowClienteDropdown, setEditShowClienteDropdown] = useState(false);
  const editClienteRef = useRef<HTMLDivElement | null>(null);
  const [editMedicoSearch, setEditMedicoSearch] = useState('');
  const [editSelectedMedicoId, setEditSelectedMedicoId] = useState('');
  const [editShowMedicoDropdown, setEditShowMedicoDropdown] = useState(false);
  const editMedicoRef = useRef<HTMLDivElement | null>(null);
  const [editItems, setEditItems] = useState<LineItem[]>([]);
  const [editSearchTexts, setEditSearchTexts] = useState<string[]>([]);
  const [editOpenDropdown, setEditOpenDropdown] = useState<number | null>(null);
  const editSearchRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editFechaVenta, setEditFechaVenta] = useState('');

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

  // Tabs
  const [tab, setTab] = useState<Tab>('ventas');

  // PackageSession (Paquete x Sesiones)
  const [packageSessions, setPackageSessions] = useState<PackageSession[]>([]);
  const [psLoading, setPsLoading] = useState(false);

  // Create PackageSession modal
  const [showCreatePs, setShowCreatePs] = useState(false);
  const [psPatientSearch, setPsPatientSearch] = useState('');
  const [psSelectedPatientId, setPsSelectedPatientId] = useState('');
  const [psShowPatientDropdown, setPsShowPatientDropdown] = useState(false);
  const psPatientRef = useRef<HTMLDivElement | null>(null);
  const [psMedicoSearch, setPsMedicoSearch] = useState('');
  const [psSelectedMedicoId, setPsSelectedMedicoId] = useState('');
  const [psShowMedicoDropdown, setPsShowMedicoDropdown] = useState(false);
  const psMedicoRef = useRef<HTMLDivElement | null>(null);
  const [psPackageSearch, setPsPackageSearch] = useState('');
  const [psSelectedPackageId, setPsSelectedPackageId] = useState('');
  const [psShowPackageDropdown, setPsShowPackageDropdown] = useState(false);
  const psPackageRef = useRef<HTMLDivElement | null>(null);
  const [psSessions, setPsSessions] = useState(1);
  const [psDiscount, setPsDiscount] = useState(0);
  const [psSaving, setPsSaving] = useState(false);
  const [psErrors, setPsErrors] = useState<Record<string, string>>({});

  // Apply session modal
  const [showApply, setShowApply] = useState(false);
  const [applyingPs, setApplyingPs] = useState<PackageSession | null>(null);
  const [applyObservaciones, setApplyObservaciones] = useState('');
  const [applySaving, setApplySaving] = useState(false);
  const [applyError, setApplyError] = useState('');

  // Cancel PackageSession modal
  const [showCancelPs, setShowCancelPs] = useState(false);
  const [cancellingPs, setCancellingPs] = useState<PackageSession | null>(null);
  const [cancelPsSaving, setCancelPsSaving] = useState(false);
  const [cancelPsError, setCancelPsError] = useState('');

  const clientes = terceros.filter(t => (t.tipoRelacion === 'CLIENTE' || t.tipoRelacion === 'CLIENTE_PROVEEDOR') && t.activo);
  const medicos = terceros.filter(t => t.tipoRelacion === 'MEDICO' && t.activo);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (openDropdown !== null && searchRefs.current[openDropdown] && !searchRefs.current[openDropdown]!.contains(e.target as Node)) setOpenDropdown(null);
      if (clienteRef.current && !clienteRef.current.contains(e.target as Node)) setShowClienteDropdown(false);
      if (medicoRef.current && !medicoRef.current.contains(e.target as Node)) setShowMedicoDropdown(false);
      if (editClienteRef.current && !editClienteRef.current.contains(e.target as Node)) setEditShowClienteDropdown(false);
      if (editMedicoRef.current && !editMedicoRef.current.contains(e.target as Node)) setEditShowMedicoDropdown(false);
      if (editOpenDropdown !== null && editSearchRefs.current[editOpenDropdown] && !editSearchRefs.current[editOpenDropdown]!.contains(e.target as Node)) setEditOpenDropdown(null);
      if (psPatientRef.current && !psPatientRef.current.contains(e.target as Node)) setPsShowPatientDropdown(false);
      if (psMedicoRef.current && !psMedicoRef.current.contains(e.target as Node)) setPsShowMedicoDropdown(false);
      if (psPackageRef.current && !psPackageRef.current.contains(e.target as Node)) setPsShowPackageDropdown(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown, editOpenDropdown]);

  const load = useCallback(async (cons?: string, cli?: string, from?: string, to?: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (cons) params.consecutivo = parseInt(cons);
      if (from) params.fechaDesde = from;
      if (to) params.fechaHasta = to;
      if (selectedWarehouseId) params.warehouseId = selectedWarehouseId;
      const [salesData, productsData, packagesData, tercerosData] = await Promise.all([
        fetchSales(Object.keys(params).length ? params : undefined),
        fetchProducts(selectedWarehouseId ?? undefined),
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
  }, [selectedWarehouseId]);

  const loadPs = useCallback(async () => {
    setPsLoading(true);
    try {
      const data = await fetchPackageSessions();
      setPackageSessions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setPsLoading(false);
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
      await createSale({ terceroId: selectedClienteId || undefined, medicoId: selectedMedicoId, warehouseId: selectedWarehouseId ?? undefined, fechaVenta, details: items });
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
    setFechaVenta(new Date().toISOString().split('T')[0]);
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
    if (sale.medicoId) {
      const m = terceros.find(t => t.id === sale.medicoId);
      if (m) {
        setEditSelectedMedicoId(m.id);
        setEditMedicoSearch(`${m.nombres} ${m.apellidos}`);
      }
    } else {
      setEditSelectedMedicoId('');
      setEditMedicoSearch('');
    }
    const editLineItems: LineItem[] = (sale.details || []).map(d => ({
      type: d.packageId ? 'PACKAGE' as const : 'PRODUCT' as const,
      productId: d.productId,
      packageId: d.packageId,
      quantity: d.quantity,
      unitPrice: d.unitPrice,
    }));
    setEditItems(editLineItems);
    setEditSearchTexts(editLineItems.map(item => {
      if (item.packageId) {
        const pkg = packages.find(p => p.id === item.packageId);
        return pkg ? pkg.nombre : '';
      }
      const prod = products.find(p => p.id === item.productId);
      return prod ? `${prod.codigo} - ${prod.nombre}` : '';
    }));
    setEditFechaVenta(sale.fechaVenta ? sale.fechaVenta.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditErrors({});
    setEditOpenDropdown(null);
    setShowEdit(true);
  }

  function selectEditCliente(t: Tercero) {
    setEditSelectedClienteId(t.id);
    setEditClienteSearch(t.tipoPersona === 'NATURAL' ? `${t.nombres} ${t.apellidos}` : t.razonSocial || '');
    setEditShowClienteDropdown(false);
  }

  function selectEditMedico(t: Tercero) {
    setEditSelectedMedicoId(t.id);
    setEditMedicoSearch(`${t.nombres} ${t.apellidos}`);
    setEditShowMedicoDropdown(false);
  }

  function getEditFilteredProducts(search: string) {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return products.filter(p => p.activo && (p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)));
  }

  function getEditFilteredPackages(search: string) {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return packages.filter(p => p.activo && p.nombre.toLowerCase().includes(q));
  }

  function selectEditProduct(idx: number, product: Product) {
    setEditItems(editItems.map((item, i) =>
      i === idx ? { ...item, type: 'PRODUCT', productId: product.id, packageId: undefined, unitPrice: product.precioVenta } : item
    ));
    setEditSearchTexts(editSearchTexts.map((t, i) => i === idx ? `${product.codigo} - ${product.nombre}` : t));
    setEditOpenDropdown(null);
  }

  function selectEditPackage(idx: number, pkg: Package) {
    setEditItems(editItems.map((item, i) =>
      i === idx ? { ...item, type: 'PACKAGE', packageId: pkg.id, productId: undefined, unitPrice: pkg.precio } : item
    ));
    setEditSearchTexts(editSearchTexts.map((t, i) => i === idx ? pkg.nombre : t));
    setEditOpenDropdown(null);
  }

  function updateEditSearch(idx: number, value: string) {
    setEditSearchTexts(editSearchTexts.map((t, i) => i === idx ? value : t));
    setEditOpenDropdown(idx);
    if (!value.trim()) setEditItems(editItems.map((item, i) => i === idx ? { ...item, type: 'PRODUCT', productId: undefined, packageId: undefined } : item));
  }

  function setEditItemType(idx: number, type: 'PRODUCT' | 'PACKAGE') {
    setEditItems(editItems.map((item, i) =>
      i === idx ? { type, productId: undefined, packageId: undefined, quantity: 1, unitPrice: 0 } : item
    ));
    setEditSearchTexts(editSearchTexts.map((t, i) => i === idx ? '' : t));
    setEditOpenDropdown(null);
  }

  function addEditItem() { setEditItems([...editItems, { type: 'PRODUCT', productId: '', quantity: 1, unitPrice: 0 }]); setEditSearchTexts([...editSearchTexts, '']); }
  function removeEditItem(idx: number) {
    if (editItems.length <= 1) return;
    setEditItems(editItems.filter((_, i) => i !== idx));
    setEditSearchTexts(editSearchTexts.filter((_, i) => i !== idx));
    if (editOpenDropdown === idx) setEditOpenDropdown(null);
  }

  function validateEdit(): boolean {
    const errs: Record<string, string> = {};
    if (!editSelectedMedicoId) errs.medico = 'Seleccione un médico';
    for (let i = 0; i < editItems.length; i++) {
      if (editItems[i].type === 'PRODUCT' && !editItems[i].productId) errs[`item-${i}-product`] = 'Seleccione un producto';
      if (editItems[i].type === 'PACKAGE' && !editItems[i].packageId) errs[`item-${i}-product`] = 'Seleccione un paquete';
      if (editItems[i].quantity < 1) errs[`item-${i}-qty`] = 'Cantidad inválida';
      if (editItems[i].unitPrice < 0) errs[`item-${i}-price`] = 'Precio inválido';
    }
    if (editItems.length === 0) errs.general = 'Agregue al menos un producto o paquete';
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSale) return;
    if (!validateEdit()) return;
    setEditSaving(true);
    try {
      const dto: UpdateSaleDto = {};
      if (editSelectedClienteId !== editingSale.terceroId) {
        dto.terceroId = editSelectedClienteId || undefined;
      }
      if (editSelectedMedicoId !== editingSale.medicoId) {
        dto.medicoId = editSelectedMedicoId || undefined;
      }
      const hasDetailChanges = JSON.stringify(editItems.map(i => ({ productId: i.productId, packageId: i.packageId, quantity: i.quantity, unitPrice: i.unitPrice }))) !==
        JSON.stringify((editingSale.details || []).map(d => ({ productId: d.productId, packageId: d.packageId, quantity: d.quantity, unitPrice: d.unitPrice })));
      if (hasDetailChanges) {
        dto.details = editItems.map(i => ({
          productId: i.productId,
          packageId: i.packageId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        }));
      }
      if (editFechaVenta) dto.fechaVenta = editFechaVenta;
      if (Object.keys(dto).length === 0) {
        setShowEdit(false); return;
      }
      await updateSale(editingSale.id, dto);
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

  function getSaleInsumoCost(sale: Sale): number {
    // Las ventas creadas desde el módulo de Ventas no almacenan costoTotal en la
    // venta (el backend solo lo guarda para ventas de paquete/sesión), por lo que
    // se calcula con los costos configurados de productos y paquetes.
    if (sale.costoTotal && sale.costoTotal > 0) return sale.costoTotal;

    return (sale.details ?? []).reduce((total, detail) => {
      const quantity = detail.quantity ?? 0;

      if (detail.packageId) {
        const pkg = packages.find(p => p.id === detail.packageId);
        if (!pkg) return total;

        const costoMedicamentos = (pkg.details ?? []).reduce((sum, comp) => {
          const product = products.find(p => p.id === comp.productId) ?? comp.product;
          return sum + (product?.costoCompra ?? 0) * (comp.quantity ?? 0);
        }, 0);

        const costoOperativo = (pkg.operatingCosts ?? []).reduce(
          (sum, costo) => sum + (costo.valor ?? 0),
          0,
        );

        return total + (costoMedicamentos + costoOperativo) * quantity;
      }

      if (detail.productId) {
        const product = products.find(p => p.id === detail.productId);
        return total + (product?.costoCompra ?? 0) * quantity;
      }

      return total;
    }, 0);
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

  function resetCreatePsModal() {
    setShowCreatePs(false);
    setPsPatientSearch('');
    setPsSelectedPatientId('');
    setPsMedicoSearch('');
    setPsSelectedMedicoId('');
    setPsPackageSearch('');
    setPsSelectedPackageId('');
    setPsSessions(1);
    setPsDiscount(0);
    setPsErrors({});
  }

  function selectPsPatient(t: Tercero) {
    setPsSelectedPatientId(t.id);
    setPsPatientSearch(t.tipoPersona === 'NATURAL' ? `${t.nombres} ${t.apellidos}` : t.razonSocial || '');
    setPsShowPatientDropdown(false);
  }

  function selectPsMedico(t: Tercero) {
    setPsSelectedMedicoId(t.id);
    setPsMedicoSearch(`${t.nombres} ${t.apellidos}`);
    setPsShowMedicoDropdown(false);
  }

  function selectPsPackage(pkg: Package) {
    setPsSelectedPackageId(pkg.id);
    setPsPackageSearch(pkg.nombre);
    setPsShowPackageDropdown(false);
  }

  function validatePs(): boolean {
    const errs: Record<string, string> = {};
    if (!psSelectedMedicoId) errs.medico = 'Seleccione un médico';
    if (!psSelectedPackageId) errs.package = 'Seleccione un paquete';
    if (psSessions < 1) errs.sessions = 'Cantidad inválida';
    if (psDiscount < 0 || psDiscount > 100) errs.discount = 'Descuento inválido (0-100)';
    setPsErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreatePs(e: React.FormEvent) {
    e.preventDefault();
    if (!validatePs()) return;
    setPsSaving(true);
    try {
      await createPackageSession({
        patientId: psSelectedPatientId || undefined,
        medicoId: psSelectedMedicoId,
        warehouseId: selectedWarehouseId ?? undefined,
        packageId: psSelectedPackageId,
        cantidadSesiones: psSessions,
        descuentoPorcentaje: psDiscount,
      });
      resetCreatePsModal();
      loadPs();
    } catch (e: any) { setPsErrors({ general: e.message }); }
    finally { setPsSaving(false); }
  }

  function openApply(ps: PackageSession) {
    setApplyingPs(ps);
    setApplyObservaciones('');
    setApplyError('');
    setShowApply(true);
  }

  async function handleApply() {
    if (!applyingPs) return;
    setApplySaving(true);
    try {
      await applyPackageSession(applyingPs.id, { observaciones: applyObservaciones || undefined });
      setShowApply(false);
      loadPs();
    } catch (e: any) { setApplyError(e.message); }
    finally { setApplySaving(false); }
  }

  function openCancelPs(ps: PackageSession) {
    setCancellingPs(ps);
    setCancelPsError('');
    setShowCancelPs(true);
  }

  async function handleCancelPs() {
    if (!cancellingPs) return;
    setCancelPsSaving(true);
    try {
      await cancelPackageSession(cancellingPs.id);
      setShowCancelPs(false);
      loadPs();
    } catch (e: any) { setCancelPsError(e.message); }
    finally { setCancelPsSaving(false); }
  }

  function getPsPatientName(ps: PackageSession) {
    if (!ps.patient) return '-';
    const p = ps.patient;
    return p.tipoPersona === 'NATURAL' ? `${p.nombres || ''} ${p.apellidos || ''}`.trim() : p.razonSocial || '';
  }

  function getPsMedicoName(ps: PackageSession) {
    if (!ps.medico) return '-';
    return `${ps.medico.nombres || ''} ${ps.medico.apellidos || ''}`.trim();
  }

  function getPsPackageName(ps: PackageSession) {
    if (!ps.package) return '-';
    return ps.package.nombre;
  }

  function getPsEstadoBadge(estado: string) {
    if (estado === 'ACTIVA') return 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400';
    if (estado === 'FINALIZADO') return 'bg-green-100 dark:bg-emerald-500/15 text-green-700 dark:text-emerald-400';
    return 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400';
  }

  // Tab UI
  function renderTabs() {
    return (
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {(['ventas', 'paquetes-sesiones', 'aplicaciones'] as Tab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); if (t !== 'ventas') loadPs(); }}
            className={`shrink-0 whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
              tab === t ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}>
            {t === 'ventas' ? 'Ventas' : t === 'paquetes-sesiones' ? 'Paquetes x Sesiones' : 'Aplicaciones'}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="sc-page-title">Ventas</h2>
        {tab === 'ventas' && (
          <button onClick={() => { resetCreateModal(); setShowCreate(true); }} className="w-fit whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-blue-500 dark:hover:bg-blue-400 cursor-pointer">
            + Nueva Venta
          </button>
        )}
        {tab === 'paquetes-sesiones' && (
          <button onClick={() => { resetCreatePsModal(); setShowCreatePs(true); }} className="w-fit whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-blue-500 dark:hover:bg-blue-400 cursor-pointer">
            + Nuevo Paquete x Sesiones
          </button>
        )}
      </div>

      {renderTabs()}

      {tab === 'ventas' && (
        <>
          {/* Search bar */}
          <div className="flex flex-wrap gap-3 mb-4 items-end">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Consecutivo</label>
              <input type="number" min={1} value={searchCons} onChange={e => setSearchCons(e.target.value)} placeholder="#"
                className="w-24 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Cliente</label>
              <input type="text" value={searchCliente} onChange={e => setSearchCliente(e.target.value)} placeholder="Nombre o documento"
                className="w-44 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Desde</label>
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Hasta</label>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <button onClick={() => load(searchCons, searchCliente, fechaDesde, fechaHasta)}
              className="px-4 py-2 rounded-xl bg-slate-700 dark:bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer">
              Buscar
            </button>
            <button onClick={() => { setSearchCons(''); setSearchCliente(''); setFechaDesde(''); setFechaHasta(''); load(); }}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              Limpiar
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>
          ) : sales.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm">No hay ventas registradas.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Comprobante</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Médico</th>
                    <th className="px-4 py-3 font-medium">Productos</th>
                    <th className="px-4 py-3 font-medium">Costo Insumos</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-medium">#{String(s.consecutivo).padStart(6, '0')}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{(s.fechaVenta ?? s.createdAt).split('T')[0]}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                        <div>{getClienteName(s)}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">{getClienteDoc(s)}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                        {s.medicoId ? (() => { const m = terceros.find(t => t.id === s.medicoId); return m ? `${m.nombres} ${m.apellidos}` : s.medicoId; })() : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {s.details?.map(d => {
                          if (d.packageId) return `${getItemName(d.packageId, 'PACKAGE')} x${d.quantity}`;
                          return `${getItemName(d.productId)} x${d.quantity}`;
                        }).join(', ')}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatCOP(getSaleInsumoCost(s))}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">{formatCOP(s.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.estado === 'ACTIVA' ? 'bg-green-100 dark:bg-emerald-500/15 text-green-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400'
                        }`}>
                          {s.estado === 'ACTIVA' ? 'Activa' : 'Anulada'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(s)} disabled={s.estado !== 'ACTIVA'}
                            className={`text-xs px-2 py-1 rounded border ${
                              s.estado === 'ACTIVA' ? 'border-blue-300 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer' : 'border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600'
                            }`}>Editar</button>
                          <button onClick={() => openCancel(s)} disabled={s.estado !== 'ACTIVA'}
                            className={`text-xs px-2 py-1 rounded border ${
                              s.estado === 'ACTIVA' ? 'border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer' : 'border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600'
                            }`}>Anular</button>
                          <button onClick={() => openComprobante(s)}
                            className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">Comprobante</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm sc-fade-in dark:bg-black/70">
          <form onSubmit={handleCreate} className="sc-slide-up rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:shadow-black/40 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 mx-4">
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Nueva Venta</h2>
            {errors.general && <p className="text-red-500 dark:text-red-400 text-xs mb-3">{errors.general}</p>}

            <div ref={clienteRef} className="relative mb-4">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Cliente</label>
              <input type="text" value={clienteSearch} onChange={e => { setClienteSearch(e.target.value); setSelectedClienteId(''); setShowClienteDropdown(true); }}
                onFocus={() => setShowClienteDropdown(true)} placeholder="Buscar cliente..." autoComplete="off"
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              {showClienteDropdown && (
                <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-36 overflow-y-auto">
                  {clientes.filter(c => {
                    const name = c.tipoPersona === 'NATURAL' ? `${c.nombres} ${c.apellidos}` : c.razonSocial || '';
                    return name.toLowerCase().includes(clienteSearch.toLowerCase()) || c.numeroDocumento.includes(clienteSearch);
                  }).map(c => (
                    <li key={c.id} onClick={() => selectCliente(c)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10">
                      {c.tipoPersona === 'NATURAL' ? `${c.nombres} ${c.apellidos}` : c.razonSocial} - {c.numeroDocumento}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div ref={medicoRef} className="relative mb-4">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Médico <span className="text-red-500 dark:text-red-400">*</span></label>
              <input type="text" value={medicoSearch} onChange={e => { setMedicoSearch(e.target.value); setSelectedMedicoId(''); setShowMedicoDropdown(true); }}
                onFocus={() => setShowMedicoDropdown(true)} placeholder="Buscar médico..." autoComplete="off"
                className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors.medico ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
              {errors.medico && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.medico}</p>}
              {showMedicoDropdown && (
                <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-36 overflow-y-auto">
                  {medicos.filter(m => {
                    const name = `${m.nombres} ${m.apellidos}`;
                    return name.toLowerCase().includes(medicoSearch.toLowerCase()) || m.numeroDocumento.includes(medicoSearch) || (m.registroProfesional || '').includes(medicoSearch);
                  }).map(m => (
                    <li key={m.id} onClick={() => selectMedico(m)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10">
                      {m.nombres} {m.apellidos} - {m.numeroDocumento} {m.registroProfesional ? `(Reg: ${m.registroProfesional})` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Fecha de la Venta</label>
              <input type="date" value={fechaVenta} onChange={e => setFechaVenta(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const productFiltered = getFilteredProducts(searchTexts[idx]);
                const packageFiltered = getFilteredPackages(searchTexts[idx]);
                const selectedPackage = item.packageId ? packages.find(p => p.id === item.packageId) : null;
                const components = selectedPackage ? getPackageComponents(item.packageId) : [];
                return (
                  <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                    <div className="flex gap-2 mb-2">
                      <button type="button" onClick={() => setItemType(idx, 'PRODUCT')}
                        className={`text-xs px-3 py-1 rounded-full font-medium cursor-pointer ${item.type === 'PRODUCT' ? 'bg-slate-900 text-white dark:bg-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                        Producto
                      </button>
                      <button type="button" onClick={() => setItemType(idx, 'PACKAGE')}
                        className={`text-xs px-3 py-1 rounded-full font-medium cursor-pointer ${item.type === 'PACKAGE' ? 'bg-slate-900 text-white dark:bg-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                        Paquete
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex-1 relative" ref={el => { searchRefs.current[idx] = el; }}>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">
                          {item.type === 'PRODUCT' ? 'Producto' : 'Paquete'}
                        </label>
                        <input type="text"
                          placeholder={item.type === 'PRODUCT' ? 'Buscar por código o nombre...' : 'Buscar paquete por nombre...'}
                          value={searchTexts[idx]}
                          onChange={e => updateSearch(idx, e.target.value)}
                          onFocus={() => setOpenDropdown(idx)}
                          autoComplete="off"
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors[`item-${idx}-product`] ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                        {openDropdown === idx && item.type === 'PRODUCT' && productFiltered.length > 0 && (
                          <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {productFiltered.map(p => (
                              <li key={p.id} onClick={() => selectProduct(idx, p)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 flex justify-between">
                                <span className="font-medium">{p.codigo}</span>
                                <span className="text-slate-500 dark:text-slate-400 ml-2">{p.nombre}</span>
                                <span className="text-slate-400 dark:text-slate-500 ml-auto">Stock: {p.stockActual}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {openDropdown === idx && item.type === 'PACKAGE' && packageFiltered.length > 0 && (
                          <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {packageFiltered.map(p => (
                              <li key={p.id} onClick={() => selectPackage(idx, p)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 flex justify-between">
                                <span className="font-medium">{p.nombre}</span>
                                <span className="text-slate-400 dark:text-slate-500 ml-auto">{formatCOP(p.precio)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="w-24">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Cantidad</label>
                        <input type="number" min={1} value={item.quantity} onChange={e => setItems(items.map((it, i) => i === idx ? { ...it, quantity: parseInt(e.target.value) || 0 } : it))}
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors[`item-${idx}-qty`] ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                      </div>
                      <div className="w-28">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Precio Unit.</label>
                        <input type="number" step="0.01" min={0} value={item.unitPrice} onChange={e => setItems(items.map((it, i) => i === idx ? { ...it, unitPrice: parseFloat(e.target.value) || 0 } : it))}
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${errors[`item-${idx}-price`] ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                      </div>
                      <div className="w-20 text-right">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Subtotal</label>
                        <p className="text-sm text-slate-800 dark:text-slate-100 py-2">{formatCOP(item.quantity * (item.unitPrice || 0))}</p>
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-lg cursor-pointer pb-1">×</button>
                    </div>
                    {item.type === 'PACKAGE' && components.length > 0 && (
                      <div className="mt-2 ml-1">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Componentes del paquete:</p>
                        <div className="flex flex-wrap gap-2">
                          {components.map((comp, ci) => {
                            const prod = products.find(p => p.id === comp.productId);
                            return (
                              <span key={ci} className="text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-slate-600 dark:text-slate-300">
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
            <button type="button" onClick={addItem} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium cursor-pointer">+ Agregar producto</button>
            <div className="flex justify-end mt-4 mb-6">
              <p className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">Total: {formatCOP(createTotal)}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetCreateModal} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-blue-500 hover:bg-slate-800 dark:hover:bg-blue-400 disabled:opacity-50 cursor-pointer">
                {saving ? 'Guardando...' : 'Registrar Venta'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm sc-fade-in dark:bg-black/70">
          <form onSubmit={handleEdit} className="sc-slide-up rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:shadow-black/40 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 mx-4">
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Editar Venta #{String(editingSale.consecutivo).padStart(6, '0')}</h2>
            {editErrors.general && <p className="text-red-500 dark:text-red-400 text-xs mb-3">{editErrors.general}</p>}

            <div ref={editClienteRef} className="relative mb-4">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Cliente</label>
              <input type="text" value={editClienteSearch} onChange={e => { setEditClienteSearch(e.target.value); setEditSelectedClienteId(''); setEditShowClienteDropdown(true); }}
                onFocus={() => setEditShowClienteDropdown(true)} placeholder="Buscar cliente..." autoComplete="off"
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              {editShowClienteDropdown && (
                <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-36 overflow-y-auto">
                  {clientes.filter(c => {
                    const name = c.tipoPersona === 'NATURAL' ? `${c.nombres} ${c.apellidos}` : c.razonSocial || '';
                    return name.toLowerCase().includes(editClienteSearch.toLowerCase()) || c.numeroDocumento.includes(editClienteSearch);
                  }).map(c => (
                    <li key={c.id} onClick={() => selectEditCliente(c)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10">
                      {c.tipoPersona === 'NATURAL' ? `${c.nombres} ${c.apellidos}` : c.razonSocial} - {c.numeroDocumento}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div ref={editMedicoRef} className="relative mb-4">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Médico <span className="text-red-500 dark:text-red-400">*</span></label>
              <input type="text" value={editMedicoSearch} onChange={e => { setEditMedicoSearch(e.target.value); setEditSelectedMedicoId(''); setEditShowMedicoDropdown(true); }}
                onFocus={() => setEditShowMedicoDropdown(true)} placeholder="Buscar médico..." autoComplete="off"
                className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${editErrors.medico ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
              {editErrors.medico && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{editErrors.medico}</p>}
              {editShowMedicoDropdown && (
                <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-36 overflow-y-auto">
                  {medicos.filter(m => {
                    const name = `${m.nombres} ${m.apellidos}`;
                    return name.toLowerCase().includes(editMedicoSearch.toLowerCase()) || m.numeroDocumento.includes(editMedicoSearch) || (m.registroProfesional || '').includes(editMedicoSearch);
                  }).map(m => (
                    <li key={m.id} onClick={() => selectEditMedico(m)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10">
                      {m.nombres} {m.apellidos} - {m.numeroDocumento} {m.registroProfesional ? `(Reg: ${m.registroProfesional})` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Fecha de la Venta</label>
              <input type="date" value={editFechaVenta} onChange={e => setEditFechaVenta(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <div className="space-y-3">
              {editItems.map((item, idx) => {
                const productFiltered = getEditFilteredProducts(editSearchTexts[idx]);
                const packageFiltered = getEditFilteredPackages(editSearchTexts[idx]);
                const selectedPackage = item.packageId ? packages.find(p => p.id === item.packageId) : null;
                const components = selectedPackage ? getPackageComponents(item.packageId) : [];
                return (
                  <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                    <div className="flex gap-2 mb-2">
                      <button type="button" onClick={() => setEditItemType(idx, 'PRODUCT')}
                        className={`text-xs px-3 py-1 rounded-full font-medium cursor-pointer ${item.type === 'PRODUCT' ? 'bg-slate-900 text-white dark:bg-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                        Producto
                      </button>
                      <button type="button" onClick={() => setEditItemType(idx, 'PACKAGE')}
                        className={`text-xs px-3 py-1 rounded-full font-medium cursor-pointer ${item.type === 'PACKAGE' ? 'bg-slate-900 text-white dark:bg-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                        Paquete
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="flex-1 relative" ref={el => { editSearchRefs.current[idx] = el; }}>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">
                          {item.type === 'PRODUCT' ? 'Producto' : 'Paquete'}
                        </label>
                        <input type="text"
                          placeholder={item.type === 'PRODUCT' ? 'Buscar por código o nombre...' : 'Buscar paquete por nombre...'}
                          value={editSearchTexts[idx]}
                          onChange={e => updateEditSearch(idx, e.target.value)}
                          onFocus={() => setEditOpenDropdown(idx)}
                          autoComplete="off"
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${editErrors[`item-${idx}-product`] ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                        {editOpenDropdown === idx && item.type === 'PRODUCT' && productFiltered.length > 0 && (
                          <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {productFiltered.map(p => (
                              <li key={p.id} onClick={() => selectEditProduct(idx, p)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 flex justify-between">
                                <span className="font-medium">{p.codigo}</span>
                                <span className="text-slate-500 dark:text-slate-400 ml-2">{p.nombre}</span>
                                <span className="text-slate-400 dark:text-slate-500 ml-auto">Stock: {p.stockActual}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {editOpenDropdown === idx && item.type === 'PACKAGE' && packageFiltered.length > 0 && (
                          <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {packageFiltered.map(p => (
                              <li key={p.id} onClick={() => selectEditPackage(idx, p)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 flex justify-between">
                                <span className="font-medium">{p.nombre}</span>
                                <span className="text-slate-400 dark:text-slate-500 ml-auto">{formatCOP(p.precio)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="w-24">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Cantidad</label>
                        <input type="number" min={1} value={item.quantity} onChange={e => setEditItems(editItems.map((it, i) => i === idx ? { ...it, quantity: parseInt(e.target.value) || 0 } : it))}
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${editErrors[`item-${idx}-qty`] ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                      </div>
                      <div className="w-28">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Precio Unit.</label>
                        <input type="number" step="0.01" min={0} value={item.unitPrice} onChange={e => setEditItems(editItems.map((it, i) => i === idx ? { ...it, unitPrice: parseFloat(e.target.value) || 0 } : it))}
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${editErrors[`item-${idx}-price`] ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                      </div>
                      <div className="w-20 text-right">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Subtotal</label>
                        <p className="text-sm text-slate-800 dark:text-slate-100 py-2">{formatCOP(item.quantity * (item.unitPrice || 0))}</p>
                      </div>
                      <button type="button" onClick={() => removeEditItem(idx)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-lg cursor-pointer pb-1">×</button>
                    </div>
                    {item.type === 'PACKAGE' && components.length > 0 && (
                      <div className="mt-2 ml-1">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Componentes del paquete:</p>
                        <div className="flex flex-wrap gap-2">
                          {components.map((comp, ci) => {
                            const prod = products.find(p => p.id === comp.productId);
                            return (
                              <span key={ci} className="text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-slate-600 dark:text-slate-300">
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
            <button type="button" onClick={addEditItem} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium cursor-pointer">+ Agregar producto</button>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={editSaving} className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-blue-500 hover:bg-slate-800 dark:hover:bg-blue-400 disabled:opacity-50 cursor-pointer">
                {editSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancel && cancellingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm sc-fade-in dark:bg-black/70">
          <div className="sc-slide-up rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:shadow-black/40 w-full max-w-md p-6 mx-4">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white mb-2">Anular Venta #{String(cancellingSale.consecutivo).padStart(6, '0')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Esta acción devolverá el stock de todos los productos. No se puede deshacer.</p>
            {cancelErrors && <p className="text-red-500 dark:text-red-400 text-xs mb-3">{cancelErrors}</p>}
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Motivo de anulación</label>
            <textarea value={cancelMotivo} onChange={e => setCancelMotivo(e.target.value)} rows={3}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400 mb-4"
              placeholder="Indique el motivo..." />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCancel(false)} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">Cancelar</button>
              <button onClick={handleCancel} disabled={cancelSaving || !cancelMotivo.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer">
                {cancelSaving ? 'Anulando...' : 'Anular Venta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprobante Modal */}
      {showComprobante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm sc-fade-in dark:bg-black/70">
          <div className="sc-slide-up rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:shadow-black/40 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 mx-4">
            {comprobanteLoading ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando comprobante...</p>
            ) : comprobanteData ? (
              <div id="comprobante-content">
                <div className="text-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">SueroControl</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Sistema de Inventario</p>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white mt-2">Comprobante de Venta</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{comprobanteData.comprobante}</p>
                </div>

                <div className="text-sm space-y-1 mb-4">
                  <p><span className="text-slate-500 dark:text-slate-400">Fecha:</span> {new Date(comprobanteData.fecha).toLocaleString()}</p>
                  {comprobanteData.estado === 'ANULADA' && (
                    <p><span className="text-red-600 dark:text-red-400 font-medium">ANULADA</span> {comprobanteData.anuladaMotivo && `- ${comprobanteData.anuladaMotivo}`}</p>
                  )}
                  {comprobanteData.cliente && (
                    <>
                      <p><span className="text-slate-500 dark:text-slate-400">Cliente:</span> {comprobanteData.cliente.nombre}</p>
                      <p><span className="text-slate-500 dark:text-slate-400">Documento:</span> {comprobanteData.cliente.documento}</p>
                      {comprobanteData.cliente.direccion && <p><span className="text-slate-500 dark:text-slate-400">Dirección:</span> {comprobanteData.cliente.direccion}</p>}
                      {comprobanteData.cliente.telefono && <p><span className="text-slate-500 dark:text-slate-400">Teléfono:</span> {comprobanteData.cliente.telefono}</p>}
                    </>
                  )}
                </div>

                <table className="w-full text-sm mb-4">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="text-left px-2 py-2">Producto</th>
                      <th className="text-center px-2 py-2">Cant.</th>
                      <th className="text-right px-2 py-2">P.Unit</th>
                      <th className="text-right px-2 py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {comprobanteData.items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-2 py-2">{item.producto}</td>
                        <td className="text-center px-2 py-2">{item.cantidad}</td>
                        <td className="text-right px-2 py-2">{formatCOP(item.precioUnitario)}</td>
                        <td className="text-right px-2 py-2">{formatCOP(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold text-slate-800 dark:text-slate-100">
                      <td colSpan={3} className="text-right px-2 py-3">Total:</td>
                      <td className="text-right px-2 py-3">{formatCOP(comprobanteData.total)}</td>
                    </tr>
                  </tfoot>
                </table>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-slate-700 dark:bg-slate-700 text-white text-sm hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer">Imprimir</button>
                  <button onClick={() => setShowComprobante(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">Cerrar</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Paquetes x Sesiones panel */}
      {tab === 'paquetes-sesiones' && (
        <div>
          {psLoading ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>
          ) : packageSessions.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm">No hay paquetes por sesiones registrados.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Paciente</th>
                    <th className="px-4 py-3 font-medium">Médico</th>
                    <th className="px-4 py-3 font-medium">Paquete</th>
                    <th className="px-4 py-3 font-medium">Sesiones</th>
                    <th className="px-4 py-3 font-medium">Aplicadas</th>
                    <th className="px-4 py-3 font-medium">Pendientes</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {packageSessions.map(ps => (
                    <tr key={ps.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{getPsPatientName(ps)}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{getPsMedicoName(ps)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{getPsPackageName(ps)}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-medium">{ps.cantidadSesiones}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{ps.sesionesConsumidas}</td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-medium">{ps.sesionesPendientes}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">{formatCOP(ps.totalPagado)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getPsEstadoBadge(ps.estado)}`}>
                          {ps.estado === 'FINALIZADO' ? 'Finalizado' : ps.estado === 'ACTIVA' ? 'Activa' : 'Cancelada'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(ps.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openApply(ps)} disabled={ps.estado !== 'ACTIVA' || ps.sesionesPendientes === 0}
                            className={`text-xs px-2 py-1 rounded border ${
                              ps.estado === 'ACTIVA' && ps.sesionesPendientes > 0 ? 'border-green-300 dark:border-emerald-500/40 text-green-600 dark:text-emerald-400 hover:bg-green-50 dark:hover:bg-emerald-500/10 cursor-pointer' : 'border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600'
                            }`}>Aplicar</button>
                          <button onClick={() => openCancelPs(ps)} disabled={ps.estado !== 'ACTIVA'}
                            className={`text-xs px-2 py-1 rounded border ${
                              ps.estado === 'ACTIVA' ? 'border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer' : 'border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600'
                            }`}>Cancelar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Aplicaciones panel */}
      {tab === 'aplicaciones' && (
        <div>
          {psLoading ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>
          ) : packageSessions.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm">No hay aplicaciones registradas.</p>
          ) : (
            <div className="space-y-4">
              {packageSessions.filter(ps => ps.applications && ps.applications.length > 0).map(ps => (
                <div key={ps.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{getPsPatientName(ps)}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">- {getPsPackageName(ps)}</span>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getPsEstadoBadge(ps.estado)}`}>
                      {ps.estado === 'FINALIZADO' ? 'Finalizado' : ps.estado === 'ACTIVA' ? 'Activa' : 'Cancelada'}
                    </span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-left dark:bg-slate-800/40 dark:text-slate-400">
                      <tr>
                        <th className="px-3 py-2 font-medium"># Sesión</th>
                        <th className="px-3 py-2 font-medium">Fecha</th>
                        <th className="px-3 py-2 font-medium">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(ps.applications || []).map(app => (
                        <tr key={app.id}>
                          <td className="px-3 py-2 text-slate-800 dark:text-slate-100 font-medium">{app.sesionNumero}</td>
                          <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{new Date(app.fechaAplicacion).toLocaleString()}</td>
                          <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{app.observaciones || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              {packageSessions.filter(ps => ps.applications && ps.applications.length > 0).length === 0 && (
                <p className="text-slate-400 dark:text-slate-500 text-sm">No hay aplicaciones registradas.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create PackageSession Modal */}
      {showCreatePs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm sc-fade-in dark:bg-black/70">
          <form onSubmit={handleCreatePs} className="sc-slide-up rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:shadow-black/40 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 mx-4">
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Nuevo Paquete x Sesiones</h2>
            {psErrors.general && <p className="text-red-500 dark:text-red-400 text-xs mb-3">{psErrors.general}</p>}

            <div ref={psPatientRef} className="relative mb-4">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Paciente</label>
              <input type="text" value={psPatientSearch} onChange={e => { setPsPatientSearch(e.target.value); setPsSelectedPatientId(''); setPsShowPatientDropdown(true); }}
                onFocus={() => setPsShowPatientDropdown(true)} placeholder="Buscar paciente..." autoComplete="off"
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
              {psShowPatientDropdown && (
                <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-36 overflow-y-auto">
                  {clientes.filter(c => {
                    const name = c.tipoPersona === 'NATURAL' ? `${c.nombres} ${c.apellidos}` : c.razonSocial || '';
                    return name.toLowerCase().includes(psPatientSearch.toLowerCase()) || c.numeroDocumento.includes(psPatientSearch);
                  }).map(c => (
                    <li key={c.id} onClick={() => selectPsPatient(c)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10">
                      {c.tipoPersona === 'NATURAL' ? `${c.nombres} ${c.apellidos}` : c.razonSocial} - {c.numeroDocumento}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div ref={psMedicoRef} className="relative mb-4">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Médico <span className="text-red-500 dark:text-red-400">*</span></label>
              <input type="text" value={psMedicoSearch} onChange={e => { setPsMedicoSearch(e.target.value); setPsSelectedMedicoId(''); setPsShowMedicoDropdown(true); }}
                onFocus={() => setPsShowMedicoDropdown(true)} placeholder="Buscar médico..." autoComplete="off"
                className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${psErrors.medico ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
              {psErrors.medico && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{psErrors.medico}</p>}
              {psShowMedicoDropdown && (
                <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-36 overflow-y-auto">
                  {medicos.filter(m => {
                    const name = `${m.nombres} ${m.apellidos}`;
                    return name.toLowerCase().includes(psMedicoSearch.toLowerCase()) || m.numeroDocumento.includes(psMedicoSearch) || (m.registroProfesional || '').includes(psMedicoSearch);
                  }).map(m => (
                    <li key={m.id} onClick={() => selectPsMedico(m)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10">
                      {m.nombres} {m.apellidos} - {m.numeroDocumento} {m.registroProfesional ? `(Reg: ${m.registroProfesional})` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div ref={psPackageRef} className="relative mb-4">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Paquete <span className="text-red-500 dark:text-red-400">*</span></label>
              <input type="text" value={psPackageSearch} onChange={e => { setPsPackageSearch(e.target.value); setPsSelectedPackageId(''); setPsShowPackageDropdown(true); }}
                onFocus={() => setPsShowPackageDropdown(true)} placeholder="Buscar paquete..." autoComplete="off"
                className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${psErrors.package ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
              {psErrors.package && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{psErrors.package}</p>}
              {psShowPackageDropdown && (
                <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {packages.filter(p => p.activo && p.nombre.toLowerCase().includes(psPackageSearch.toLowerCase())).map(p => (
                    <li key={p.id} onClick={() => selectPsPackage(p)} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 flex justify-between">
                      <span className="font-medium">{p.nombre}</span>
                      <span className="text-slate-400 dark:text-slate-500 ml-auto">{formatCOP(p.precio)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Número de Sesiones <span className="text-red-500 dark:text-red-400">*</span></label>
                <input type="number" min={1} value={psSessions} onChange={e => setPsSessions(parseInt(e.target.value) || 0)}
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${psErrors.sessions ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                {psErrors.sessions && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{psErrors.sessions}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Descuento (%)</label>
                <input type="number" min={0} max={100} value={psDiscount} onChange={e => setPsDiscount(parseFloat(e.target.value) || 0)}
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${psErrors.discount ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                {psErrors.discount && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{psErrors.discount}</p>}
              </div>
            </div>

            {psSelectedPackageId && (() => {
              const pkg = packages.find(p => p.id === psSelectedPackageId);
              if (!pkg) return null;
              const subtotal = pkg.precio * psSessions;
              const descuentoValor = subtotal * (psDiscount / 100);
              const total = subtotal - descuentoValor;
              return (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 mb-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Precio unitario:</span>
                    <span className="text-slate-800 dark:text-slate-100">{formatCOP(pkg.precio)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Subtotal:</span>
                    <span className="text-slate-800 dark:text-slate-100">{formatCOP(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Descuento ({psDiscount}%):</span>
                    <span className="text-red-600 dark:text-red-400">-{formatCOP(descuentoValor)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-200">Total a pagar:</span>
                    <span className="text-slate-900 dark:text-white">{formatCOP(total)}</span>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetCreatePsModal} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={psSaving} className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-blue-500 hover:bg-slate-800 dark:hover:bg-blue-400 disabled:opacity-50 cursor-pointer">
                {psSaving ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Apply Session Modal */}
      {showApply && applyingPs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm sc-fade-in dark:bg-black/70">
          <div className="sc-slide-up rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:shadow-black/40 w-full max-w-md p-6 mx-4">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white mb-2">Aplicar Sesión</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {getPsPatientName(applyingPs)} - {getPsPackageName(applyingPs)}
              <br />
              Sesión {applyingPs.sesionesConsumidas + 1} de {applyingPs.cantidadSesiones}
            </p>
            {applyError && <p className="text-red-500 dark:text-red-400 text-xs mb-3">{applyError}</p>}
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Observaciones (opcional)</label>
            <textarea value={applyObservaciones} onChange={e => setApplyObservaciones(e.target.value)} rows={3}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 mb-4"
              placeholder="Notas sobre la aplicación..." />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowApply(false)} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">Cancelar</button>
              <button onClick={handleApply} disabled={applySaving}
                className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer">
                {applySaving ? 'Aplicando...' : 'Aplicar Sesión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel PackageSession Modal */}
      {showCancelPs && cancellingPs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm sc-fade-in dark:bg-black/70">
          <div className="sc-slide-up rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:shadow-black/40 w-full max-w-md p-6 mx-4">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white mb-2">Cancelar Paquete x Sesiones</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {getPsPatientName(cancellingPs)} - {getPsPackageName(cancellingPs)}
            </p>
            {cancelPsError && <p className="text-red-500 dark:text-red-400 text-xs mb-3">{cancelPsError}</p>}
            {cancellingPs.sesionesConsumidas > 0 ? (
              <div className="bg-yellow-50 dark:bg-amber-500/10 border border-yellow-200 dark:border-amber-500/30 rounded-xl p-3 mb-4">
                <p className="text-sm text-yellow-800 dark:text-amber-200">
                  Este Paquete x Sesiones tiene {cancellingPs.sesionesConsumidas} sesión(es) aplicada(s).
                  Requiere un proceso administrativo especial. No se puede cancelar directamente.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">¿Está seguro de cancelar este Paquete x Sesiones? Esta acción no se puede deshacer.</p>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCancelPs(false)} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">Cerrar</button>
              {cancellingPs.sesionesConsumidas === 0 && (
                <button onClick={handleCancelPs} disabled={cancelPsSaving}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer">
                  {cancelPsSaving ? 'Cancelando...' : 'Cancelar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
