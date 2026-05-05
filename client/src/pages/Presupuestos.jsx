import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { FiPlus, FiEye, FiTrash2, FiPrinter, FiFilter, FiDownload } from 'react-icons/fi';

const ESTADOS = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  aceptado: 'bg-blue-100 text-blue-700',
  en_curso: 'bg-indigo-100 text-indigo-700',
  finalizado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-700'
};

export default function Presupuestos() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [tratamientos, setTratamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [form, setForm] = useState({ paciente_id: '', doctor_id: '', notas: '', descuento: '0' });
  const [detalles, setDetalles] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPaciente, setFiltroPaciente] = useState('');
  const [showFiltros, setShowFiltros] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroPaciente) params.paciente_id = filtroPaciente;
      const { data } = await api.get('/presupuestos', { params });
      setPresupuestos(data);
    } catch {
      toast.error('Error al cargar presupuestos');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatos = async () => {
    try {
      const [pacRes, docRes, tratRes] = await Promise.all([
        api.get('/pacientes', { params: { limit: 1000 } }),
        api.get('/usuarios/doctores'),
        api.get('/tratamientos')
      ]);
      setPacientes(pacRes.data.pacientes || []);
      setDoctores(docRes.data);
      setTratamientos(tratRes.data);
    } catch {}
  };

  useEffect(() => { cargar(); }, [filtroEstado, filtroPaciente]);
  useEffect(() => { cargarDatos(); }, []);

  const agregarDetalle = () => {
    setDetalles([...detalles, { tratamiento_id: '', pieza_dental: '', precio: '' }]);
  };

  const actualizarDetalle = (idx, campo, valor) => {
    const nuevos = [...detalles];
    nuevos[idx][campo] = valor;
    if (campo === 'tratamiento_id') {
      const trat = tratamientos.find(t => t.id === parseInt(valor));
      if (trat) nuevos[idx].precio = trat.precio;
    }
    setDetalles(nuevos);
  };

  const eliminarDetalle = (idx) => {
    setDetalles(detalles.filter((_, i) => i !== idx));
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (detalles.length === 0) {
      toast.error('Agregue al menos un tratamiento');
      return;
    }
    try {
      await api.post('/presupuestos', {
        ...form,
        descuento: parseFloat(form.descuento) || 0,
        detalles: detalles.map(d => ({
          tratamiento_id: parseInt(d.tratamiento_id),
          pieza_dental: d.pieza_dental ? parseInt(d.pieza_dental) : null,
          precio: parseFloat(d.precio)
        }))
      });
      toast.success('Presupuesto creado');
      setModal(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear');
    }
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await api.put(`/presupuestos/${id}`, { estado });
      cargar();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    try {
      await api.delete(`/presupuestos/${id}`);
      toast.success('Presupuesto eliminado');
      cargar();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const verDetalle = async (id) => {
    try {
      const { data } = await api.get(`/presupuestos/${id}`);
      setModalDetalle(data);
    } catch {
      toast.error('Error al cargar detalle');
    }
  };

  const imprimirPresupuesto = (p) => {
    const win = window.open('', '_blank', 'width=700,height=900');
    const filas = (p.detalles || []).map(d => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${d.tratamiento?.nombre || ''}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${d.pieza_dental || '-'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${Number(d.precio).toLocaleString()}</td>
      </tr>
    `).join('');
    const totalPagado = (p.pagos || []).reduce((s, pa) => s + parseFloat(pa.monto), 0);
    const saldo = parseFloat(p.total) - totalPagado - parseFloat(p.descuento || 0);

    win.document.write(`<!DOCTYPE html><html><head><img src="/logo_clinica-removebg-preview.png.png" style="width:80px;margin-bottom:10px;" /><title>Presupuesto #${p.id}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:40px;max-width:650px;margin:0 auto;color:#333}
      .header{text-align:center;border-bottom:3px solid #fcf0be;padding-bottom:20px;margin-bottom:25px}
      .header h1{margin:0;color:#fcf0be;font-size:24px}
      .header p{margin:4px 0;color:#666;font-size:12px}
      .info{display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px}
      .info div{flex:1}
      .info .label{color:#888;font-size:11px;text-transform:uppercase}
      .info .value{font-weight:bold;margin-top:2px}
      table{width:100%;border-collapse:collapse;margin:15px 0}
      th{background:#f8fafc;padding:10px 8px;text-align:left;font-size:12px;color:#666;border-bottom:2px solid #e2e8f0}
      .totals{margin-top:15px;text-align:right;font-size:14px}
      .totals .row{display:flex;justify-content:flex-end;gap:30px;padding:4px 0}
      .totals .grand{font-size:20px;font-weight:bold;color:#fcf0be;border-top:2px solid #fcf0be;padding-top:8px;margin-top:8px}
      .footer{margin-top:50px;display:flex;justify-content:space-between;font-size:11px;color:#999}
      .firma{margin-top:60px;display:flex;justify-content:space-around}
      .firma div{text-align:center;width:200px}
      .firma .linea{border-top:1px solid #333;margin-top:50px;padding-top:5px;font-size:12px;color:#666}
      .estado{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:bold;text-transform:uppercase}
      @media print{body{padding:20px}}
    </style></head><body>
      <div class="header">
        <h1>Clinica Dental Almar</h1>
        <p>Presupuesto Odontológico</p>
      </div>
      <div class="info">
        <div><div class="label">Paciente</div><div class="value">${p.paciente?.nombre} ${p.paciente?.apellido}</div><div style="font-size:12px;color:#666">DNI: ${p.paciente?.dni || ''}</div></div>
        <div><div class="label">Doctor</div><div class="value">Dr. ${p.doctor?.nombre} ${p.doctor?.apellido}</div></div>
        <div style="text-align:right"><div class="label">Presupuesto</div><div class="value">#${p.id}</div><div style="font-size:12px;color:#666">${p.createdAt?.split('T')[0] || ''}</div></div>
      </div>
      <table>
        <thead><tr><th>Tratamiento</th><th style="text-align:center">Pieza</th><th style="text-align:right">Precio</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      <div class="totals">
        <div class="row"><span>Subtotal:</span><span>$${Number(p.total).toLocaleString()}</span></div>
        ${parseFloat(p.descuento) > 0 ? `<div class="row"><span>Descuento:</span><span>-$${Number(p.descuento).toLocaleString()}</span></div>` : ''}
        ${totalPagado > 0 ? `<div class="row"><span>Pagado:</span><span style="color:green">-$${Number(totalPagado).toLocaleString()}</span></div>` : ''}
        <div class="row grand"><span>Total${saldo < parseFloat(p.total) ? ' pendiente' : ''}:</span><span>$${Number(Math.max(0, saldo)).toLocaleString()}</span></div>
      </div>
      <div class="firma">
        <div><div class="linea">Firma del profesional</div></div>
        <div><div class="linea">Firma del paciente</div></div>
      </div>
      <div class="footer">
        <span>Presupuesto válido por 30 días</span>
        <span>Impreso: ${new Date().toLocaleDateString('es-AR')}</span>
      </div>
      <script>window.onload=function(){window.print()}</script>
    </body></html>`);
    win.document.close();
  };

  const total = detalles.reduce((s, d) => s + (parseFloat(d.precio) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary-800">Presupuestos</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowFiltros(!showFiltros)} className={`btn-secondary flex items-center gap-1 ${(filtroEstado || filtroPaciente) ? 'ring-2 ring-primary-300' : ''}`}>
            <FiFilter size={16} /> Filtros
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (filtroEstado) params.set('estado', filtroEstado);
              window.open(`/api/exportar/presupuestos?${params.toString()}`, '_blank');
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <FiDownload size={16} /> CSV
          </button>
          <button onClick={() => { setForm({ paciente_id: '', doctor_id: '', notas: '', descuento: '0' }); setDetalles([]); setModal(true); }} className="btn-primary flex items-center gap-2">
            <FiPlus size={16} /> Nuevo Presupuesto
          </button>
        </div>
      </div>

      {showFiltros && (
        <div className="card flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Estado</label>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="input-field w-auto">
              <option value="">Todos</option>
              {Object.keys(ESTADOS).map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Paciente</label>
            <select value={filtroPaciente} onChange={e => setFiltroPaciente(e.target.value)} className="input-field w-auto">
              <option value="">Todos</option>
              {pacientes.map(p => <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>)}
            </select>
          </div>
          <button onClick={() => { setFiltroEstado(''); setFiltroPaciente(''); }} className="btn-secondary text-sm">Limpiar</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando...</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-modern">
            <thead>
              <tr>
                <th>#</th>
                <th>Paciente</th>
                <th>Doctor</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {presupuestos.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-surface-400">No hay presupuestos</td></tr>
              ) : presupuestos.map(p => (
                <tr key={p.id}>
                  <td className="text-surface-400 font-medium">#{p.id}</td>
                  <td className="font-semibold text-primary-900">{p.paciente?.nombre} {p.paciente?.apellido}</td>
                  <td className="text-surface-600">Dr. {p.doctor?.nombre} {p.doctor?.apellido}</td>
                  <td className="font-semibold text-dental-600">${Number(p.total).toLocaleString()}</td>
                  <td>
                    <select
                      value={p.estado}
                      onChange={(e) => cambiarEstado(p.id, e.target.value)}
                      className={`badge ${ESTADOS[p.estado]} border-0 cursor-pointer text-xs`}
                    >
                      {Object.keys(ESTADOS).map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="text-surface-500">{p.createdAt?.split('T')[0]}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => verDetalle(p.id)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors" title="Ver detalle"><FiEye size={16} /></button>
                      <button onClick={async () => { const { data } = await api.get(`/presupuestos/${p.id}`); imprimirPresupuesto(data); }} className="p-2 text-surface-500 hover:bg-surface-100 rounded-xl transition-colors" title="Imprimir"><FiPrinter size={16} /></button>
                      <button onClick={() => eliminar(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Eliminar"><FiTrash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nuevo Presupuesto */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nuevo Presupuesto" size="xl">
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Paciente *</label>
              <select value={form.paciente_id} onChange={e => setForm({ ...form, paciente_id: e.target.value })} className="input-field" required>
                <option value="">Seleccionar</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 mb-1">Doctor *</label>
              <select value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })} className="input-field" required>
                <option value="">Seleccionar</option>
                {doctores.map(d => <option key={d.id} value={d.id}>Dr. {d.nombre} {d.apellido}</option>)}
              </select>
            </div>
          </div>

          {/* Detalles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Tratamientos</label>
              <button type="button" onClick={agregarDetalle} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                <FiPlus size={14} /> Agregar
              </button>
            </div>
            {detalles.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">Agregue tratamientos al presupuesto</p>
            ) : (
              <div className="space-y-2">
                {detalles.map((d, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <select value={d.tratamiento_id} onChange={e => actualizarDetalle(i, 'tratamiento_id', e.target.value)} className="input-field text-sm" required>
                        <option value="">Tratamiento</option>
                        {tratamientos.map(t => <option key={t.id} value={t.id}>{t.nombre} - ${Number(t.precio).toLocaleString()}</option>)}
                      </select>
                    </div>
                    <div className="w-24">
                      <input type="number" placeholder="Pieza" value={d.pieza_dental} onChange={e => actualizarDetalle(i, 'pieza_dental', e.target.value)} className="input-field text-sm" />
                    </div>
                    <div className="w-28">
                      <input type="number" step="0.01" placeholder="Precio" value={d.precio} onChange={e => actualizarDetalle(i, 'precio', e.target.value)} className="input-field text-sm" required />
                    </div>
                    <button type="button" onClick={() => eliminarDetalle(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-xs text-gray-500">Descuento</label>
                <input type="number" step="0.01" value={form.descuento} onChange={e => setForm({ ...form, descuento: e.target.value })} className="input-field w-28 text-sm" />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold text-green-700">${(total - (parseFloat(form.descuento) || 0)).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary">Crear Presupuesto</button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle */}
      <Modal isOpen={!!modalDetalle} onClose={() => setModalDetalle(null)} title={`Presupuesto #${modalDetalle?.id}`} size="lg">
        {modalDetalle && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => imprimirPresupuesto(modalDetalle)} className="btn-secondary flex items-center gap-2 text-sm">
                <FiPrinter size={15} /> Imprimir Presupuesto
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Paciente:</span> <span className="font-medium">{modalDetalle.paciente?.nombre} {modalDetalle.paciente?.apellido}</span></div>
              <div><span className="text-gray-500">Doctor:</span> <span className="font-medium">Dr. {modalDetalle.doctor?.nombre} {modalDetalle.doctor?.apellido}</span></div>
            </div>
            <table className="table-modern">
              <thead><tr><th>Tratamiento</th><th>Pieza</th><th>Estado</th><th className="text-right">Precio</th></tr></thead>
              <tbody>
                {modalDetalle.detalles?.map(d => (
                  <tr key={d.id}>
                    <td className="font-medium text-primary-900">{d.tratamiento?.nombre}</td>
                    <td className="text-surface-600">{d.pieza_dental || '-'}</td>
                    <td><span className="badge bg-surface-100 text-surface-600">{d.estado}</span></td>
                    <td className="text-right font-medium text-dental-600">${Number(d.precio).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-surface-200 font-semibold">
                  <td colSpan={3} className="text-right">Total:</td>
                  <td className="text-right text-dental-600">${Number(modalDetalle.total).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
            {modalDetalle.pagos?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Pagos realizados</h4>
                {modalDetalle.pagos.map(p => (
                  <div key={p.id} className="flex justify-between text-sm p-3 bg-surface-50 rounded-xl mb-1.5 border border-surface-100">
                    <span>{p.fecha} - {p.metodo_pago?.replace('_', ' ')}</span>
                    <span className="font-medium">${Number(p.monto).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
