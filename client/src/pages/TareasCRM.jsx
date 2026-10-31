import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiCalendar, FiCheck, FiCheckSquare, FiClock, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../api/axios';
import Modal from '../components/Modal';

const vacio = { paciente_id: '', asignado_id: '', titulo: '', tipo: 'SEGUIMIENTO', prioridad: 'MEDIA', vence: '', notas: '' };

export default function TareasCRM() {
  const [data, setData] = useState({ tareas: [], metricas: {} });
  const [catalogos, setCatalogos] = useState({ pacientes: [], responsables: [] });
  const [estado, setEstado] = useState('PENDIENTE');
  const [mias, setMias] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(vacio);

  const cargar = async () => {
    try {
      const [tareas, cats] = await Promise.all([api.get('/crm/tareas', { params: { estado, mias: mias ? 1 : 0 } }), api.get('/crm/catalogos')]);
      setData(tareas.data); setCatalogos(cats.data);
    } catch (error) { toast.error(error.response?.data?.error || 'No se pudieron cargar las tareas.'); }
  };
  useEffect(() => { cargar(); }, [estado, mias]);

  const crear = async event => {
    event.preventDefault();
    try { await api.post('/crm/tareas', form); toast.success('Tarea creada'); setModal(false); setForm(vacio); cargar(); }
    catch (error) { toast.error(error.response?.data?.error || 'No se pudo crear.'); }
  };
  const toggle = async id => { try { await api.put(`/crm/tareas/${id}/toggle`); toast.success('Tarea actualizada'); cargar(); } catch (error) { toast.error(error.response?.data?.error || 'No se pudo actualizar.'); } };
  const eliminar = async id => { if (!window.confirm('¿Eliminar esta tarea?')) return; try { await api.delete(`/crm/tareas/${id}`); cargar(); } catch (error) { toast.error(error.response?.data?.error || 'No se pudo eliminar.'); } };

  const vencida = tarea => tarea.estado === 'PENDIENTE' && tarea.vence && new Date(tarea.vence) < new Date();

  return <div className="space-y-4 animate-fade-in">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-xl font-extrabold text-primary-900 sm:text-2xl">Tareas y seguimiento</h1><p className="text-sm text-slate-400">Llamadas, WhatsApp y próximas acciones con pacientes</p></div><button onClick={() => setModal(true)} className="btn-primary"><FiPlus /> Nueva tarea</button></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
      ['Pendientes', data.metricas.pendientes || 0, FiClock, 'bg-sky-100 text-sky-700'],
      ['Vencidas', data.metricas.vencidas || 0, FiAlertTriangle, 'bg-red-100 text-red-700'],
      ['Para hoy', data.metricas.hoy || 0, FiCalendar, 'bg-amber-100 text-amber-700'],
      ['Completadas', data.metricas.completadas || 0, FiCheckSquare, 'bg-emerald-100 text-emerald-700']
    ].map(([nombre, valor, Icon, color]) => <div key={nombre} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className={`rounded-xl p-3 ${color}`}><Icon /></span><div><p className="text-xl font-extrabold text-slate-900">{valor}</p><p className="text-xs text-slate-500">{nombre}</p></div></div>)}</div>
    <div className="flex flex-wrap gap-2"><button onClick={() => setEstado('PENDIENTE')} className={estado === 'PENDIENTE' ? 'btn-primary !px-3 !py-2 text-xs' : 'btn-secondary !px-3 !py-2 text-xs'}>Pendientes</button><button onClick={() => setEstado('HECHA')} className={estado === 'HECHA' ? 'btn-primary !px-3 !py-2 text-xs' : 'btn-secondary !px-3 !py-2 text-xs'}>Completadas</button><label className="ml-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600"><input type="checkbox" checked={mias} onChange={e => setMias(e.target.checked)} /> Solo mis tareas</label></div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {data.tareas.length === 0 ? <div className="p-12 text-center text-sm text-slate-400">No hay tareas en esta vista.</div> : <div className="divide-y divide-slate-100">{data.tareas.map(tarea => <div key={tarea.id} className={`flex items-start gap-3 p-4 ${vencida(tarea) ? 'bg-red-50/60' : ''}`}><button onClick={() => toggle(tarea.id)} className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${tarea.estado === 'HECHA' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-transparent hover:border-emerald-400'}`}><FiCheck /></button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className={`text-sm font-bold ${tarea.estado === 'HECHA' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{tarea.titulo}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${tarea.prioridad === 'ALTA' ? 'bg-red-100 text-red-700' : tarea.prioridad === 'BAJA' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>{tarea.prioridad}</span></div><p className="mt-1 text-xs text-slate-500">{tarea.tipo}{tarea.paciente ? ` · ${tarea.paciente.nombre} ${tarea.paciente.apellido}` : ''}{tarea.asignado ? ` · ${tarea.asignado.nombre} ${tarea.asignado.apellido}` : ''}</p>{tarea.vence && <p className={`mt-1 text-[11px] ${vencida(tarea) ? 'font-bold text-red-600' : 'text-slate-400'}`}>{vencida(tarea) ? 'Vencida · ' : ''}{new Date(tarea.vence).toLocaleString('es-MX')}</p>}</div><button onClick={() => eliminar(tarea.id)} className="rounded-lg p-2 text-slate-300 hover:bg-red-50 hover:text-red-600"><FiTrash2 /></button></div>)}</div>}
    </section>
    <Modal isOpen={modal} onClose={() => setModal(false)} title="Nueva tarea" size="lg"><form onSubmit={crear} className="space-y-4"><label className="block text-sm font-medium">Título *<input required className="input-field mt-1" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Paciente<select className="input-field mt-1" value={form.paciente_id} onChange={e => setForm({ ...form, paciente_id: e.target.value })}><option value="">Sin paciente</option>{catalogos.pacientes.map(p => <option key={p.id} value={p.id}>{p.apellido}, {p.nombre}</option>)}</select></label><label className="text-sm font-medium">Asignar a<select className="input-field mt-1" value={form.asignado_id} onChange={e => setForm({ ...form, asignado_id: e.target.value })}><option value="">A mí</option>{catalogos.responsables.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}</select></label></div><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-medium">Tipo<select className="input-field mt-1" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>{['LLAMADA','WHATSAPP','CITA','SEGUIMIENTO','OTRA'].map(x => <option key={x}>{x}</option>)}</select></label><label className="text-sm font-medium">Prioridad<select className="input-field mt-1" value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}>{['BAJA','MEDIA','ALTA'].map(x => <option key={x}>{x}</option>)}</select></label><label className="text-sm font-medium">Vencimiento<input type="datetime-local" className="input-field mt-1" value={form.vence} onChange={e => setForm({ ...form, vence: e.target.value })} /></label></div><label className="block text-sm font-medium">Notas<textarea rows="3" className="input-field mt-1" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button><button className="btn-primary">Crear tarea</button></div></form></Modal>
  </div>;
}
