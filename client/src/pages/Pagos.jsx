import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiDownload } from 'react-icons/fi';

export default function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ paciente_id: '', presupuesto_id: '', monto: '', metodo_pago: 'efectivo', fecha: new Date().toISOString().split('T')[0], numero_recibo: '', notas: '' });
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroDesde && filtroHasta) {
        params.desde = filtroDesde;
        params.hasta = filtroHasta;
      }
      const { data } = await api.get('/pagos', { params });
      setPagos(data);
    } catch {
      toast.error('Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatos = async () => {
    try {
      const [pacRes, presRes] = await Promise.all([
        api.get('/pacientes', { params: { limit: 1000 } }),
        api.get('/presupuestos')
      ]);
      setPacientes(pacRes.data.pacientes || []);
      setPresupuestos(presRes.data);
    } catch {}
  };

  useEffect(() => { cargar(); cargarDatos(); }, []);
  useEffect(() => { if (filtroDesde && filtroHasta) cargar(); }, [filtroDesde, filtroHasta]);

  const guardar = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pagos', {
        ...form,
        monto: parseFloat(form.monto),
        presupuesto_id: form.presupuesto_id || null
      });
      toast.success('Pago registrado');
      setModal(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar pago');
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este pago?')) return;
    try {
      await api.delete(`/pagos/${id}`);
      toast.success('Pago eliminado');
      cargar();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const totalFiltrado = pagos.reduce((s, p) => s + parseFloat(p.monto), 0);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const presupuestosPaciente = presupuestos.filter(p => p.paciente_id === parseInt(form.paciente_id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary-800">Pagos</h1>
        <div className="flex gap-2">
          <a
            href={`/api/exportar/pagos${filtroDesde && filtroHasta ? `?desde=${filtroDesde}&hasta=${filtroHasta}` : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2"
          >
            <FiDownload size={16} /> Exportar CSV
          </a>
          <button onClick={() => { setForm({ paciente_id: '', presupuesto_id: '', monto: '', metodo_pago: 'efectivo', fecha: new Date().toISOString().split('T')[0], numero_recibo: '', notas: '' }); setModal(true); }} className="btn-primary flex items-center gap-2">
            <FiPlus size={16} /> Registrar Pago
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-surface-500 mb-1">Desde</label>
          <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} className="input-field w-auto" />
        </div>
        <div>
          <label className="block text-xs text-surface-500 mb-1">Hasta</label>
          <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} className="input-field w-auto" />
        </div>
        {(filtroDesde || filtroHasta) && (
          <button onClick={() => { setFiltroDesde(''); setFiltroHasta(''); }} className="btn-secondary text-sm">Limpiar</button>
        )}
        <div className="ml-auto card-gradient bg-gradient-to-r from-dental-500 to-dental-600 py-3 px-6">
          <p className="text-dental-100 text-xs">Total</p>
          <p className="text-2xl font-bold">${totalFiltrado.toLocaleString()}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando...</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Paciente</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Recibo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-surface-400">No hay pagos registrados</td></tr>
              ) : pagos.map(p => (
                <tr key={p.id}>
                  <td className="text-surface-600">{p.fecha}</td>
                  <td className="font-semibold text-primary-900">{p.paciente?.nombre} {p.paciente?.apellido}</td>
                  <td className="font-semibold text-dental-600">${Number(p.monto).toLocaleString()}</td>
                  <td><span className="badge bg-primary-50 text-primary-700 capitalize">{p.metodo_pago?.replace('_', ' ')}</span></td>
                  <td className="text-surface-500">{p.numero_recibo || '-'}</td>
                  <td>
                    <button onClick={() => eliminar(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><FiTrash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Registrar Pago">
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Paciente *</label>
            <select name="paciente_id" value={form.paciente_id} onChange={handleChange} className="input-field" required>
              <option value="">Seleccionar</option>
              {pacientes.map(p => <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>)}
            </select>
          </div>
          {presupuestosPaciente.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Presupuesto (opcional)</label>
              <select name="presupuesto_id" value={form.presupuesto_id} onChange={handleChange} className="input-field">
                <option value="">Sin asociar</option>
                {presupuestosPaciente.map(p => <option key={p.id} value={p.id}>#{p.id} - ${Number(p.total).toLocaleString()} ({p.estado})</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Monto *</label>
              <input name="monto" type="number" step="0.01" value={form.monto} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Fecha *</label>
              <input name="fecha" type="date" value={form.fecha} onChange={handleChange} className="input-field" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Método de Pago *</label>
              <select name="metodo_pago" value={form.metodo_pago} onChange={handleChange} className="input-field" required>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta_debito">Tarjeta Débito</option>
                <option value="tarjeta_credito">Tarjeta Crédito</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">N° Recibo</label>
              <input name="numero_recibo" value={form.numero_recibo} onChange={handleChange} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Notas</label>
            <textarea name="notas" value={form.notas} onChange={handleChange} className="input-field" rows={2} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Registrar Pago</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
