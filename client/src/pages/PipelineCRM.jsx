import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiCalendar, FiDollarSign, FiEdit2, FiPlus, FiTarget, FiTrash2,
  FiTrendingUp, FiAward, FiUser
} from 'react-icons/fi';
import api from '../api/axios';
import Modal from '../components/Modal';

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const vacio = { paciente_id: '', etapa_id: '', responsable_id: '', titulo: '', tratamiento_interes: '', valor: '', origen: '', cierre_estimado: '', notas: '' };

function Metrica({ icon: Icon, label, value, detail, color }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}><Icon /></span><div className="min-w-0"><p className="text-xs text-slate-500">{label}</p><p className="truncate text-xl font-extrabold text-slate-900">{value}</p><p className="text-[10px] text-slate-400">{detail}</p></div></div></div>;
}

export default function PipelineCRM() {
  const [data, setData] = useState({ etapas: [], oportunidades: [], metricas: {} });
  const [catalogos, setCatalogos] = useState({ pacientes: [], responsables: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(vacio);
  const [dragId, setDragId] = useState(null);

  const cargar = async () => {
    try {
      const [pipeline, cats] = await Promise.all([api.get('/crm/pipeline'), api.get('/crm/catalogos')]);
      setData(pipeline.data);
      setCatalogos(cats.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo cargar el pipeline.');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const abrir = oportunidad => {
    setEditando(oportunidad || null);
    setForm(oportunidad ? {
      paciente_id: oportunidad.paciente_id,
      etapa_id: oportunidad.etapa_id,
      responsable_id: oportunidad.responsable_id || '',
      titulo: oportunidad.titulo,
      tratamiento_interes: oportunidad.tratamiento_interes || '',
      valor: oportunidad.valor || '',
      origen: oportunidad.origen || '',
      cierre_estimado: oportunidad.cierre_estimado || '',
      notas: oportunidad.notas || ''
    } : { ...vacio, etapa_id: data.etapas.find(e => e.tipo === 'ABIERTA')?.id || '' });
    setModal(true);
  };

  const guardar = async event => {
    event.preventDefault();
    try {
      if (editando) await api.put(`/crm/oportunidades/${editando.id}`, form);
      else await api.post('/crm/oportunidades', form);
      toast.success(editando ? 'Oportunidad actualizada' : 'Oportunidad creada');
      setModal(false);
      await cargar();
    } catch (error) { toast.error(error.response?.data?.error || 'No se pudo guardar.'); }
  };

  const mover = async (id, etapaId) => {
    const actual = data.oportunidades.find(o => o.id === Number(id));
    if (!actual || Number(actual.etapa_id) === Number(etapaId)) return;
    const etapa = data.etapas.find(e => e.id === Number(etapaId));
    let motivo_perdida = '';
    if (etapa?.tipo === 'PERDIDA') {
      motivo_perdida = window.prompt('Motivo por el que no se concretó:') || '';
      if (!motivo_perdida.trim()) return;
    }
    try {
      await api.put(`/crm/oportunidades/${id}/mover`, { etapa_id: etapaId, motivo_perdida });
      toast.success(`Movida a ${etapa?.nombre}`);
      await cargar();
    } catch (error) { toast.error(error.response?.data?.error || 'No se pudo mover.'); }
  };

  const eliminar = async () => {
    if (!editando || !window.confirm('¿Eliminar esta oportunidad?')) return;
    try { await api.delete(`/crm/oportunidades/${editando.id}`); setModal(false); toast.success('Oportunidad eliminada'); await cargar(); }
    catch (error) { toast.error(error.response?.data?.error || 'No se pudo eliminar.'); }
  };

  const porEtapa = useMemo(() => Object.fromEntries(data.etapas.map(e => [e.id, data.oportunidades.filter(o => Number(o.etapa_id) === Number(e.id))])), [data]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;

  return <div className="space-y-4 animate-fade-in">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-xl font-extrabold text-primary-900 sm:text-2xl">Pipeline de atención</h1><p className="text-sm text-slate-400">Pacientes por convertir y tratamientos en seguimiento</p></div><button onClick={() => abrir()} className="btn-primary"><FiPlus /> Nueva oportunidad</button></div>

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Metrica icon={FiTarget} label="Oportunidades abiertas" value={data.metricas.abiertas || 0} detail="Seguimientos activos" color="bg-violet-100 text-violet-700" />
      <Metrica icon={FiDollarSign} label="Valor del pipeline" value={moneda.format(data.metricas.valor || 0)} detail="Valor total estimado" color="bg-sky-100 text-sky-700" />
      <Metrica icon={FiTrendingUp} label="Ponderado" value={moneda.format(data.metricas.ponderado || 0)} detail="Según probabilidad" color="bg-emerald-100 text-emerald-700" />
      <Metrica icon={FiAward} label="Tasa de éxito" value={`${data.metricas.tasa_exito || 0}%`} detail={`Ciclo medio ${data.metricas.ciclo_dias || 0} días`} color="bg-amber-100 text-amber-700" />
    </div>

    <div className="-mx-3 overflow-x-auto px-3 pb-3 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8">
      <div className="flex min-w-max gap-3">
        {data.etapas.map(etapa => {
          const oportunidades = porEtapa[etapa.id] || [];
          const total = oportunidades.reduce((s, o) => s + Number(o.valor || 0), 0);
          return <section key={etapa.id} className="w-[290px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80"
            onDragOver={e => e.preventDefault()} onDrop={() => { if (dragId) mover(dragId, etapa.id); setDragId(null); }}>
            <div className="border-b-2 bg-white p-3" style={{ borderColor: etapa.color }}><div className="flex items-start justify-between"><div><h2 className="text-sm font-bold text-slate-900">{etapa.nombre} <span className="font-normal text-slate-400">· {oportunidades.length}</span></h2><p className="text-xs text-slate-500">{moneda.format(total)} · prob. {etapa.probabilidad}%</p></div><button onClick={() => abrir()} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-primary-600"><FiPlus /></button></div></div>
            <div className="min-h-48 space-y-2 p-2">
              {oportunidades.map(o => <article key={o.id} draggable onDragStart={() => setDragId(o.id)} onDragEnd={() => setDragId(null)} onClick={() => abrir(o)} className="cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:border-primary-300 hover:shadow-md active:cursor-grabbing">
                <div className="flex items-start justify-between gap-2"><h3 className="text-sm font-bold leading-tight text-slate-900">{o.titulo}</h3><FiEdit2 className="shrink-0 text-slate-300" size={13} /></div>
                <p className="mt-1 text-xs text-slate-500"><FiUser className="mr-1 inline" />{o.paciente?.nombre} {o.paciente?.apellido}</p>
                {o.tratamiento_interes && <p className="mt-1 truncate text-[11px] text-slate-400">{o.tratamiento_interes}</p>}
                <div className="mt-3 flex items-end justify-between"><b className="text-sm text-slate-900">{moneda.format(o.valor || 0)}</b>{o.cierre_estimado && <span className="text-[10px] text-slate-400"><FiCalendar className="mr-1 inline" />{new Date(`${o.cierre_estimado}T12:00:00`).toLocaleDateString('es-MX')}</span>}</div>
                <select aria-label="Cambiar etapa" value={o.etapa_id} onClick={e => e.stopPropagation()} onChange={e => mover(o.id, e.target.value)} className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs md:hidden">{data.etapas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select>
              </article>)}
              {!oportunidades.length && <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">Arrastra una oportunidad aquí</div>}
            </div>
          </section>;
        })}
      </div>
    </div>

    <Modal isOpen={modal} onClose={() => setModal(false)} title={editando ? 'Editar oportunidad' : 'Nueva oportunidad'} size="lg">
      <form onSubmit={guardar} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Paciente *<select required className="input-field mt-1" value={form.paciente_id} onChange={e => setForm({ ...form, paciente_id: e.target.value })}><option value="">Seleccionar…</option>{catalogos.pacientes.map(p => <option key={p.id} value={p.id}>{p.apellido}, {p.nombre} · {p.dni}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Etapa *<select required disabled={Boolean(editando)} className="input-field mt-1" value={form.etapa_id} onChange={e => setForm({ ...form, etapa_id: e.target.value })}>{data.etapas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label></div>
        <label className="block text-sm font-medium text-slate-700">Título *<input required maxLength={160} className="input-field mt-1" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ej. Tratamiento de ortodoncia" /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Tratamiento de interés<input className="input-field mt-1" value={form.tratamiento_interes} onChange={e => setForm({ ...form, tratamiento_interes: e.target.value })} /></label><label className="text-sm font-medium text-slate-700">Valor estimado<input type="number" min="0" step="0.01" className="input-field mt-1" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></label></div>
        <div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-medium text-slate-700">Responsable<select className="input-field mt-1" value={form.responsable_id} onChange={e => setForm({ ...form, responsable_id: e.target.value })}><option value="">Sin asignar</option>{catalogos.responsables.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Origen<select className="input-field mt-1" value={form.origen} onChange={e => setForm({ ...form, origen: e.target.value })}><option value="">No indicado</option>{['Facebook','Instagram','WhatsApp','Recomendación','Sitio web','Paciente actual','Otro'].map(x => <option key={x}>{x}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Cierre estimado<input type="date" className="input-field mt-1" value={form.cierre_estimado} onChange={e => setForm({ ...form, cierre_estimado: e.target.value })} /></label></div>
        <label className="block text-sm font-medium text-slate-700">Notas<textarea rows="3" className="input-field mt-1" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></label>
        <div className="flex flex-wrap justify-between gap-3">{editando ? <button type="button" onClick={eliminar} className="btn-danger"><FiTrash2 /> Eliminar</button> : <span />}<div className="ml-auto flex gap-2"><button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button><button className="btn-primary">Guardar</button></div></div>
      </form>
    </Modal>
    <div className="text-right"><Link to="/crm" className="text-xs font-semibold text-primary-700">Volver al Panel CRM</Link></div>
  </div>;
}
