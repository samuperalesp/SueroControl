import { useState, useEffect, useCallback } from 'react';
import type { Tercero, CreateTerceroDto } from '../types/tercero';
import { fetchTerceros, createTercero, updateTercero, deleteTercero } from '../api/terceroApi';

const tipoRelacionOptions = [
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'PROVEEDOR', label: 'Proveedor' },
  { value: 'CLIENTE_PROVEEDOR', label: 'Cliente y Proveedor' },
  { value: 'MEDICO', label: 'Médico' },
];

const documentoOptions = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'NIT', label: 'NIT' },
  { value: 'PAS', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
];

const docLabel: Record<string, string> = {
  CC: 'CC', CE: 'CE', NIT: 'NIT', PAS: 'PAS', TI: 'TI',
};

const emptyForm: CreateTerceroDto = {
  tipoRelacion: 'CLIENTE',
  tipoPersona: 'NATURAL',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  digitoVerificacion: '',
  nombres: '',
  apellidos: '',
  razonSocial: '',
  registroProfesional: '',
  direccion: '',
  ciudad: '',
  departamento: '',
  telefono: '',
  email: '',
  observaciones: '',
  activo: true,
};

export default function Terceros() {
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tercero | null>(null);
  const [form, setForm] = useState<CreateTerceroDto>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTerceros();
      setTerceros(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  }

  function openEdit(t: Tercero) {
    setEditing(t);
    setForm({
      tipoRelacion: t.tipoRelacion,
      tipoPersona: t.tipoPersona,
      tipoDocumento: t.tipoDocumento,
      numeroDocumento: t.numeroDocumento,
      digitoVerificacion: t.digitoVerificacion || '',
      nombres: t.nombres || '',
      apellidos: t.apellidos || '',
      razonSocial: t.razonSocial || '',
      registroProfesional: t.registroProfesional || '',
      direccion: t.direccion || '',
      ciudad: t.ciudad || '',
      departamento: t.departamento || '',
      telefono: t.telefono || '',
      email: t.email || '',
      observaciones: t.observaciones || '',
      activo: t.activo,
    });
    setErrors({});
    setShowModal(true);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.numeroDocumento.trim()) errs.numeroDocumento = 'Requerido';
    if (form.tipoDocumento === 'NIT' && !form.digitoVerificacion?.trim()) {
      errs.digitoVerificacion = 'Requerido para NIT';
    }
    if (form.tipoPersona === 'NATURAL') {
      if (!form.nombres?.trim()) errs.nombres = 'Requerido';
      if (!form.apellidos?.trim()) errs.apellidos = 'Requerido';
    } else {
      if (!form.razonSocial?.trim()) errs.razonSocial = 'Requerido';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.tipoDocumento !== 'NIT') delete payload.digitoVerificacion;
      if (editing) {
        await updateTercero(editing.id, payload);
      } else {
        await createTercero(payload);
      }
      setShowModal(false);
      await load();
    } catch (e: any) {
      setErrors({ general: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este tercero?')) return;
    try {
      await deleteTercero(id);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  const relacionLabel: Record<string, string> = {
    CLIENTE: 'Cliente',
    PROVEEDOR: 'Proveedor',
    CLIENTE_PROVEEDOR: 'Cli/Prov',
    MEDICO: 'Médico',
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="sc-page-title">Terceros</h2>
        <button onClick={openNew} className="w-fit whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-blue-500 dark:hover:bg-blue-400 cursor-pointer">
          + Nuevo Tercero
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>
      ) : terceros.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm">No hay terceros registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Relación</th>
                <th className="px-4 py-3 font-medium">Reg. Prof.</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {terceros.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                    {docLabel[t.tipoDocumento] || t.tipoDocumento}: {t.numeroDocumento}
                    {t.digitoVerificacion ? `-${t.digitoVerificacion}` : ''}
                  </td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100 font-medium">
                    {t.tipoPersona === 'NATURAL'
                      ? `${t.nombres} ${t.apellidos}`
                      : t.razonSocial}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {t.tipoPersona === 'NATURAL' ? 'Natural' : 'Jurídica'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400">
                      {relacionLabel[t.tipoRelacion] || t.tipoRelacion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t.tipoRelacion === 'MEDICO' ? (t.registroProfesional || '-') : '-'}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t.telefono || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${t.activo ? 'bg-green-100 dark:bg-emerald-500/15 text-green-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400'}`}>
                      {t.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(t)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium cursor-pointer">Editar</button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-medium cursor-pointer">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm sc-fade-in dark:bg-black/70">
          <div className="sc-slide-up rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:shadow-black/40 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 mx-4">
            <h3 className="mb-4 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              {editing ? 'Editar Tercero' : 'Nuevo Tercero'}
            </h3>

            {errors.general && <p className="text-red-500 dark:text-red-400 text-xs mb-3">{errors.general}</p>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Tipo Persona</label>
                <select value={form.tipoPersona} onChange={e => setForm({ ...form, tipoPersona: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none">
                  <option value="NATURAL">Persona Natural</option>
                  <option value="JURIDICA">Persona Jurídica</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Relación</label>
                <select value={form.tipoRelacion} onChange={e => setForm({ ...form, tipoRelacion: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none">
                  {tipoRelacionOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Tipo Documento</label>
                <select value={form.tipoDocumento} onChange={e => setForm({ ...form, tipoDocumento: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none">
                  {documentoOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">N° Documento</label>
                <input value={form.numeroDocumento} onChange={e => setForm({ ...form, numeroDocumento: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${errors.numeroDocumento ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                {errors.numeroDocumento && <span className="text-xs text-red-500 dark:text-red-400">{errors.numeroDocumento}</span>}
              </div>

              {form.tipoDocumento === 'NIT' && (
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Dígito Verificación</label>
                  <input value={form.digitoVerificacion || ''} onChange={e => setForm({ ...form, digitoVerificacion: e.target.value })} maxLength={1} className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${errors.digitoVerificacion ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                  {errors.digitoVerificacion && <span className="text-xs text-red-500 dark:text-red-400">{errors.digitoVerificacion}</span>}
                </div>
              )}

              {form.tipoPersona === 'NATURAL' ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Nombres</label>
                    <input value={form.nombres || ''} onChange={e => setForm({ ...form, nombres: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${errors.nombres ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                    {errors.nombres && <span className="text-xs text-red-500 dark:text-red-400">{errors.nombres}</span>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Apellidos</label>
                    <input value={form.apellidos || ''} onChange={e => setForm({ ...form, apellidos: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${errors.apellidos ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                    {errors.apellidos && <span className="text-xs text-red-500 dark:text-red-400">{errors.apellidos}</span>}
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Razón Social</label>
                  <input value={form.razonSocial || ''} onChange={e => setForm({ ...form, razonSocial: e.target.value })} className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${errors.razonSocial ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`} />
                  {errors.razonSocial && <span className="text-xs text-red-500 dark:text-red-400">{errors.razonSocial}</span>}
                </div>
              )}

              {form.tipoRelacion === 'MEDICO' && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Registro Profesional</label>
                  <input value={form.registroProfesional || ''} onChange={e => setForm({ ...form, registroProfesional: e.target.value })} placeholder="Opcional" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none" />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Teléfono</label>
                <input value={form.telefono || ''} onChange={e => setForm({ ...form, telefono: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Email</label>
                <input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Dirección</label>
                <input value={form.direccion || ''} onChange={e => setForm({ ...form, direccion: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Ciudad</label>
                <input value={form.ciudad || ''} onChange={e => setForm({ ...form, ciudad: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Observaciones</label>
                <input value={form.observaciones || ''} onChange={e => setForm({ ...form, observaciones: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none" />
              </div>
            </div>

            <label className="flex items-center gap-2 mt-4 text-sm text-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={form.activo ?? true} onChange={e => setForm({ ...form, activo: e.target.checked })} className="accent-blue-600" />
              Activo
            </label>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-blue-500 hover:bg-slate-800 dark:hover:bg-blue-400 disabled:opacity-50 cursor-pointer">
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
