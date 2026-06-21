import { useState, useEffect, useCallback } from 'react';
import type { Purchase } from '../types/purchase';
import type { Product } from '../types/product';
import type { Tercero } from '../types/tercero';
import { fetchPurchases, createPurchase, convertPedidoToCompra } from '../api/purchaseApi';
import { fetchProducts } from '../api/productApi';
import { fetchTerceros } from '../api/terceroApi';
import PurchaseModal from '../components/PurchaseModal';

type Tab = 'facturas' | 'pedidos';

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [tab, setTab] = useState<Tab>('facturas');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalTipo, setModalTipo] = useState<'COMPRA' | 'PEDIDO'>('COMPRA');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [purchasesData, productsData, tercerosData] = await Promise.all([
        fetchPurchases(),
        fetchProducts(),
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
  }, []);

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

  async function handleSave(data: { facturaNumero?: string; terceroId?: string; details: { productId: string; quantity: number; unitCost: number }[] }) {
    await createPurchase({ tipo: modalTipo, facturaNumero: data.facturaNumero, terceroId: data.terceroId, details: data.details });
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Compras</h2>
        <button
          onClick={tab === 'facturas' ? handleNewFactura : handleNewPedido}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer"
        >
          + Nueva {tab === 'facturas' ? 'Factura' : 'Pedido'}
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('facturas')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors cursor-pointer ${
            tab === 'facturas' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Facturas
        </button>
        <button
          onClick={() => setTab('pedidos')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors cursor-pointer ${
            tab === 'pedidos' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pedidos
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : activeList.length === 0 ? (
        <p className="text-gray-400 text-sm">
          No hay {tab === 'facturas' ? 'facturas' : 'pedidos'} registrados.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-left">
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
            <tbody className="divide-y divide-gray-100">
              {activeList.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600">{p.facturaNumero || '-'}</td>
                  <td className="px-4 py-3 text-gray-800">{getProveedorName(p.terceroId)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.details?.map(d => `${getProductName(d.productId)} x${d.quantity}`).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">${p.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.tipo === 'COMPRA' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.tipo === 'COMPRA' ? 'Completado' : 'Pendiente'}
                    </span>
                  </td>
                  {tab === 'pedidos' && (
                    <td className="px-4 py-3">
                      <button onClick={() => handleConvert(p.id)} className="text-blue-600 hover:text-blue-800 text-xs font-medium cursor-pointer">
                        Convertir a Compra
                      </button>
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
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
