import { useState } from 'react';
import type { Product, CreateProductDto } from '../types/product';

interface Props {
  product?: Product | null;
  onSave: (data: CreateProductDto) => Promise<void>;
  onClose: () => void;
}

const emptyForm: CreateProductDto = {
  codigo: '',
  nombre: '',
  categoria: '',
  descripcion: '',
  costoCompra: 0,
  precioVenta: 0,
  stockActual: 0,
  stockMinimo: 0,
  activo: true,
};

export default function ProductModal({ product, onSave, onClose }: Props) {
  const [form, setForm] = useState<CreateProductDto>(
    product
      ? {
          codigo: product.codigo,
          nombre: product.nombre,
          categoria: product.categoria,
          descripcion: product.descripcion,
          costoCompra: product.costoCompra,
          precioVenta: product.precioVenta,
          stockActual: product.stockActual,
          stockMinimo: product.stockMinimo,
          activo: product.activo,
        }
      : emptyForm,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.codigo.trim()) errs.codigo = 'Requerido';
    if (!form.nombre.trim()) errs.nombre = 'Requerido';
    if (!form.categoria.trim()) errs.categoria = 'Requerido';
    if (!form.descripcion.trim()) errs.descripcion = 'Requerido';
    if (form.costoCompra < 0) errs.costoCompra = 'No puede ser negativo';
    if (form.precioVenta < 0) errs.precioVenta = 'No puede ser negativo';
    if (form.stockActual < 0) errs.stockActual = 'No puede ser negativo';
    if (form.stockMinimo < 0) errs.stockMinimo = 'No puede ser negativo';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          {product ? 'Editar Producto' : 'Nuevo Producto'}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Código" value={form.codigo} error={errors.codigo} onChange={v => setForm({ ...form, codigo: v })} />
          <Field label="Nombre" value={form.nombre} error={errors.nombre} onChange={v => setForm({ ...form, nombre: v })} />
          <Field label="Categoría" value={form.categoria} error={errors.categoria} onChange={v => setForm({ ...form, categoria: v })} />
          <div className="col-span-2">
            <Field label="Descripción" value={form.descripcion} error={errors.descripcion} onChange={v => setForm({ ...form, descripcion: v })} />
          </div>
          <NumberField label="Costo Compra" value={form.costoCompra} error={errors.costoCompra} onChange={v => setForm({ ...form, costoCompra: v })} />
          <NumberField label="Precio Venta" value={form.precioVenta} error={errors.precioVenta} onChange={v => setForm({ ...form, precioVenta: v })} />
          <NumberField label="Stock Actual" value={form.stockActual} error={errors.stockActual} onChange={v => setForm({ ...form, stockActual: v })} step="1" />
          <NumberField label="Stock Mínimo" value={form.stockMinimo} error={errors.stockMinimo} onChange={v => setForm({ ...form, stockMinimo: v })} step="1" />
        </div>

        <label className="flex items-center gap-2 mt-4 text-sm text-gray-700">
          <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} className="accent-blue-600" />
          Producto activo
        </label>

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            {saving ? 'Guardando...' : product ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, error, onChange }: { label: string; value: string; error?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${error ? 'border-red-400' : 'border-gray-300'}`} />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

function NumberField({ label, value, error, onChange, step = '0.01' }: { label: string; value: number; error?: string; onChange: (v: number) => void; step?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input type="number" step={step} min={0} value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)} className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 ${error ? 'border-red-400' : 'border-gray-300'}`} />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
