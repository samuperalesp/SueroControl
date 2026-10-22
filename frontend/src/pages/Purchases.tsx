import { useState, useEffect, useCallback } from 'react';
import type { Purchase } from '../types/purchase';
import type { Product } from '../types/product';
import type { Tercero } from '../types/tercero';
import { fetchPurchases, createPurchase, updatePurchase, convertPedidoToCompra } from '../api/purchaseApi';
import { fetchProducts } from '../api/productApi';
import { fetchTerceros } from '../api/terceroApi';
import PurchaseModal from '../components/PurchaseModal';
import { useWarehouse } from '../context/WarehouseContext';

type Tab = 'facturas' | 'pedidos';

export default function Purchases() {
  const { selectedWarehouseId } = useWarehouse();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [tab, setTab] = useState<Tab>('facturas');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalTipo, setModalTipo] = useState<'COMPRA' | 'PEDIDO'>('COMPRA');
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [purchasesData, productsData, tercerosData] = await Promise.all([
        fetchPurchases(selectedWarehouseId ?? undefined),
        fetchProducts(selectedWarehouseId ?? undefined),
        fetchTerceros(),
      ]);
      setPurchases(purchasesData);
      setProducts(productsData);
      setTerceros(tercerosData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouseId]);

  useEffect(() => { load(); }, [load]);

  const facturas = purchases.filter(p => p.tipo === 'COMPRA');
  const pedidos = purchases.filter(p => p.tipo === 'PEDIDO');
  const proveedores = terceros.filter(t =>
    (t.tipoRelacion === 'PROVEEDOR' || t.tipoRelacion === 'CLIENTE_PROVEEDOR') && t.activo,
  );

  function handleNewFactura() {
    setModalTipo('COMPRA');
    setShowModal(true);
  }

  function handleNewPedido() {
    setModalTipo('PEDIDO');
    setShowModal(true);
  }

  function handleEditPedido(pedido: Purchase) {
    setEditingPurchase(pedido);
    setModalTipo('PEDIDO');
    setShowModal(true);
  }

  async function handleSave(data: { facturaNumero?: string; terceroId?: string; fechaCompra?: string; details: { productId: string; quantity: number; unitCost: number }[] }) {
    if (editingPurchase) {
      const dto: { terceroId?: string; warehouseId?: string; fechaCompra?: string; details?: { productId: string; quantity: number; unitCost: number }[] } = {};
      if (data.terceroId !== editingPurchase.terceroId) dto.terceroId = data.terceroId;
      if (data.fechaCompra) dto.fechaCompra = data.fechaCompra;
      const hasDetailChanges = JSON.stringify(data.details) !== JSON.stringify(editingPurchase.details?.map(d => ({ productId: d.productId, quantity: d.quantity, unitCost: d.unitCost })));
      if (hasDetailChanges) dto.details = data.details;
      if (selectedWarehouseId) dto.warehouseId = selectedWarehouseId;
      if (Object.keys(dto).length > 0) {
        await updatePurchase(editingPurchase.id, dto);
      }
    } else {
      await createPurchase({ tipo: modalTipo, facturaNumero: data.facturaNumero, terceroId: data.terceroId, warehouseId: selectedWarehouseId ?? undefined, fechaCompra: data.fechaCompra, details: data.details });
    }
    setEditingPurchase(null);
    setShowModal(false);
    await load();
  }

  async function handleConvert(pedidoId: string) {
    if (!confirm('¿Convertir este pedido en compra? Se incrementará el stock.')) return;
    try {
      await convertPedidoToCompra(pedidoId);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  function getProductName(productId: string) {
    return products.find(p => p.id === productId)?.nombre || productId;
  }

  function getProveedorName(terceroId?: string) {
    if (!terceroId) return '-';
    const t = terceros.find(te => te.id === terceroId);
    if (!t) return '-';
    return t.tipoPersona === 'NATURAL' ? `${t.nombres} ${t.apellidos}` : t.razonSocial || '-';
  }

  const activeList = tab === 'facturas' ? facturas : pedidos;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="sc-page-title">Compras</h2>
        <button
          onClick={tab === 'facturas' ? handleNewFactura : handleNewPedido}
          className="w-fit whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-blue-500 dark:hover:bg-blue-400 cursor-pointer"
        >
          + Nueva {tab === 'facturas' ? 'Factura' : 'Pedido'}
        </button>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab('facturas')}
          className={`shrink-0 whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
            tab === 'facturas' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Facturas
        </button>
        <button
          onClick={() => setTab('pedidos')}
          className={`shrink-0 whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
            tab === 'pedidos' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Pedidos
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>
      ) : activeList.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm">
          No hay {tab === 'facturas' ? 'facturas' : 'pedidos'} registrados.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">N° Factura</th>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">Productos</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                {tab === 'pedidos' && <th className="px-4 py-3 font-medium">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeList.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{(p.fechaCompra ?? p.createdAt).split('T')[0]}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.facturaNumero || '-'}</td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{getProveedorName(p.terceroId)}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {p.details?.map(d => `${getProductName(d.productId)} x${d.quantity}`).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium">${p.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.tipo === 'COMPRA' ? 'bg-green-100 dark:bg-emerald-500/15 text-green-700 dark:text-emerald-400' : 'bg-yellow-100 dark:bg-amber-500/15 text-yellow-700 dark:text-amber-400'
                    }`}>
                      {p.tipo === 'COMPRA' ? 'Completado' : 'Pendiente'}
                    </span>
                  </td>
                  {tab === 'pedidos' && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditPedido(p)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium cursor-pointer">
                          Editar
                        </button>
                        <button onClick={() => handleConvert(p.id)}
                          className="text-green-600 dark:text-emerald-400 hover:text-green-800 dark:hover:text-emerald-300 text-xs font-medium cursor-pointer">
                          Convertir a Compra
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <PurchaseModal
          tipo={modalTipo}
          products={products}
          proveedores={proveedores}
          initialData={editingPurchase ? { id: editingPurchase.id, facturaNumero: editingPurchase.facturaNumero, terceroId: editingPurchase.terceroId, details: editingPurchase.details } : undefined}
          onSave={handleSave}
          onClose={() => { setEditingPurchase(null); setShowModal(false); }}
        />
      )}
    </div>
  );
}
