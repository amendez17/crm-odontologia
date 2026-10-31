import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCalendar, FiCheckSquare, FiDollarSign, FiEdit3, FiExternalLink, FiMessageCircle, FiPhone, FiRefreshCw, FiTarget, FiTrash2 } from 'react-icons/fi';
import api from '../api/axios';

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const fechaHora = valor => valor ? new Date(valor).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function FichaPacienteCRM() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [catalogos, setCatalogos] = useState({ responsables: [] });
  const [perfil, setPerfil] = useState({ responsable_id: '', origen: '', acepta_marketing: false, observaciones: '' });
  const [nota, setNota] = useState({ tipo: 'NOTA', texto: '' });
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    try {
      const [ficha, cats] = await Promise.all([api.get(`/crm/pacientes/${id}/360`), api.get('/crm/catalogos')]);
      setData(ficha.data); setCatalogos(cats.data);
      const p = ficha.data.perfil || {};
      setPerfil({ responsable_id: p.responsable_id || '', origen: p.origen || '', acepta_marketing: Boolean(p.acepta_marketing), observaciones: p.observaciones || '' });
    } catch (err) { toast.error(err.response?.data?.error || 'No fue posible cargar la ficha.'); }
  };
  useEffect(() => { cargar(); }, [id]);

  const guardarPerfil = async e => {
    e.preventDefault(); setGuardando(true);
    try { await api.put(`/crm/pacientes/${id}/perfil`, perfil); toast.success('Perfil CRM actualizado.'); await cargar(); }
    catch (err) { toast.error(err.response?.data?.error || 'No se pudo guardar.'); }
    finally { setGuardando(false); }
  };
  const agregarNota = async e => {
    e.preventDefault();
    try { await api.post(`/crm/pacientes/${id}/notas`, nota); setNota({ tipo: 'NOTA', texto: '' }); toast.success('Interacción registrada.'); await cargar(); }
    catch (err) { toast.error(err.response?.data?.error || 'No se pudo guardar la nota.'); }
  };
  const eliminarNota = async notaId => {
    if (!window.confirm('¿Eliminar esta nota CRM?')) return;
    try { await api.delete(`/crm/notas/${notaId}`); toast.success('Nota eliminada.'); await cargar(); }
    catch (err) { toast.error(err.response?.data?.error || 'No se pudo eliminar.'); }
  };
  if (!data) return <div className="flex h-64 items-center justify-center"><FiRefreshCw className="animate-spin text-primary-600" size={30} /></div>;
  const { paciente, actividad } = data;
  const whatsapp = paciente.telefono ? `https://wa.me/${String(paciente.telefono).replace(/\D/g, '').replace(/^(\d{10})$/, '52$1')}` : null;

  return <div className="space-y-4 animate-fade-in">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Link to="/crm/pacientes" className="rounded-xl border bg-white p-2.5 text-slate-600"><FiArrowLeft /></Link><div><h1 className="text-xl font-extrabold text-primary-900">{paciente.nombre} {paciente.apellido}</h1><p className="text-xs text-slate-400">Ficha CRM 360° · {paciente.dni}</p></div></div><div className="flex gap-2">{whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-secondary !px-3 !py-2 text-xs"><FiPhone /> WhatsApp</a>}<Link to={`/pacientes/${paciente.id}`} className="btn-primary !px-3 !py-2 text-xs"><FiExternalLink /> Expediente</Link></div></div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5"><div className="rounded-2xl border bg-white p-4"><span className="text-[10px] text-slate-400">Segmento</span><b className="mt-1 block text-sm" style={{ color: paciente.segmento.color }}>{paciente.segmento.nombre}</b></div><div className="rounded-2xl border bg-white p-4"><span className="text-[10px] text-slate-400">Salud</span><b className="mt-1 block text-xl">{paciente.salud}/100</b></div><div className="rounded-2xl border bg-white p-4"><span className="text-[10px] text-slate-400">Visitas</span><b className="mt-1 block text-xl">{paciente.visitas}</b></div><div className="rounded-2xl border bg-white p-4"><span className="text-[10px] text-slate-400">Valor histórico</span><b className="mt-1 block truncate text-sm">{moneda.format(paciente.valor_historico)}</b></div><div className="col-span-2 rounded-2xl border bg-white p-4 lg:col-span-1"><span className="text-[10px] text-slate-400">Próxima cita</span><b className="mt-1 block text-sm">{paciente.proxima_cita || 'Sin agendar'}</b></div></div>

    <div className="grid gap-4 xl:grid-cols-3">
      <section className="rounded-2xl border bg-white p-4 shadow-sm xl:col-span-1"><div className="mb-4 flex items-center gap-2"><FiEdit3 className="text-primary-600" /><h2 className="font-bold">Perfil comercial</h2></div><form onSubmit={guardarPerfil} className="space-y-3"><label className="block text-xs font-medium text-slate-600">Responsable<select className="input-field mt-1" value={perfil.responsable_id} onChange={e => setPerfil({ ...perfil, responsable_id: e.target.value })}><option value="">Sin asignar</option>{catalogos.responsables.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}</select></label><label className="block text-xs font-medium text-slate-600">Origen<input className="input-field mt-1" value={perfil.origen} onChange={e => setPerfil({ ...perfil, origen: e.target.value })} placeholder="Recomendación, redes, Google..." /></label><label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs"><input type="checkbox" checked={perfil.acepta_marketing} onChange={e => setPerfil({ ...perfil, acepta_marketing: e.target.checked })} /> Aceptó comunicaciones promocionales</label><label className="block text-xs font-medium text-slate-600">Observaciones<textarea className="input-field mt-1 min-h-24" value={perfil.observaciones} onChange={e => setPerfil({ ...perfil, observaciones: e.target.value })} /></label><button disabled={guardando} className="btn-primary w-full">{guardando ? 'Guardando...' : 'Guardar perfil'}</button></form></section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm xl:col-span-2"><div className="mb-4 flex items-center gap-2"><FiMessageCircle className="text-primary-600" /><h2 className="font-bold">Interacciones CRM</h2></div><form onSubmit={agregarNota} className="mb-4 grid gap-2 sm:grid-cols-[150px_1fr_auto]"><select className="input-field" value={nota.tipo} onChange={e => setNota({ ...nota, tipo: e.target.value })}><option value="NOTA">Nota</option><option value="LLAMADA">Llamada</option><option value="WHATSAPP">WhatsApp</option><option value="VISITA">Visita</option></select><input required className="input-field" value={nota.texto} onChange={e => setNota({ ...nota, texto: e.target.value })} placeholder="Escribe el resultado del contacto..." /><button className="btn-primary !px-4">Agregar</button></form><div className="max-h-80 space-y-2 overflow-y-auto">{!actividad.notas.length ? <p className="rounded-xl border border-dashed p-8 text-center text-xs text-slate-400">Sin interacciones registradas.</p> : actividad.notas.map(n => <div key={n.id} className="flex gap-3 rounded-xl bg-slate-50 p-3"><span className="rounded-lg bg-white px-2 py-1 text-[9px] font-bold text-primary-700">{n.tipo}</span><div className="min-w-0 flex-1"><p className="text-xs text-slate-700">{n.texto}</p><small className="text-[9px] text-slate-400">{n.usuario ? `${n.usuario.nombre} ${n.usuario.apellido} · ` : ''}{fechaHora(n.createdAt)}</small></div>{n.tipo !== 'SISTEMA' && <button onClick={() => eliminarNota(n.id)} className="text-slate-300 hover:text-red-500"><FiTrash2 size={14} /></button>}</div>)}</div></section>
    </div>

    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4"><Actividad titulo="Citas recientes" icon={FiCalendar} vacio="Sin citas" items={actividad.citas.map(c => ({ id: c.id, principal: `${c.fecha} · ${String(c.hora_inicio).slice(0, 5)}`, secundario: `${c.motivo || 'Consulta'} · ${c.estado}` }))} /><Actividad titulo="Pagos" icon={FiDollarSign} vacio="Sin pagos" items={actividad.pagos.map(p => ({ id: p.id, principal: moneda.format(p.monto), secundario: `${p.fecha} · ${String(p.metodo_pago).replaceAll('_', ' ')}` }))} /><Actividad titulo="Oportunidades" icon={FiTarget} vacio="Sin oportunidades" items={actividad.oportunidades.map(o => ({ id: o.id, principal: o.titulo, secundario: `${o.etapa?.nombre || o.estado} · ${moneda.format(o.valor)}` }))} /><Actividad titulo="Tareas" icon={FiCheckSquare} vacio="Sin tareas" items={actividad.tareas.map(t => ({ id: t.id, principal: t.titulo, secundario: `${t.estado} · ${t.vence ? fechaHora(t.vence) : 'Sin vencimiento'}` }))} /></div>
  </div>;
}

function Actividad({ titulo, icon: Icon, items, vacio }) {
  return <section className="rounded-2xl border bg-white p-4 shadow-sm"><div className="mb-3 flex items-center gap-2"><Icon className="text-primary-600" /><h2 className="text-sm font-bold">{titulo}</h2></div><div className="max-h-72 space-y-2 overflow-y-auto">{!items.length ? <p className="rounded-xl border border-dashed p-6 text-center text-[10px] text-slate-400">{vacio}</p> : items.slice(0, 12).map(item => <div key={item.id} className="rounded-xl bg-slate-50 p-3"><b className="block truncate text-xs text-slate-800">{item.principal}</b><span className="block truncate text-[10px] capitalize text-slate-400">{item.secundario}</span></div>)}</div></section>;
}
