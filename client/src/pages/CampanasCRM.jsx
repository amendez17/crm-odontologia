import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCalendar, FiCheckCircle, FiDollarSign, FiEye, FiMessageCircle, FiPlus, FiSend, FiTrash2, FiUsers, FiVolume2 } from 'react-icons/fi';
import api from '../api/axios';
import Modal from '../components/Modal';

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const opcionesSegmento = [
  ['todos', 'Todos los autorizados'], ['campeones', 'Campeones'], ['leales', 'Leales'], ['activos', 'Activos'],
  ['nuevos', 'Nuevos'], ['en_riesgo', 'En riesgo'], ['dormidos', 'Dormidos'], ['prospectos', 'Prospectos']
];
const inicial = { nombre: '', segmento: 'en_riesgo', plantilla_id: '', mensaje: '' };

const colorEstado = { BORRADOR: 'bg-slate-100 text-slate-600', ACTIVA: 'bg-emerald-100 text-emerald-700', FINALIZADA: 'bg-indigo-100 text-indigo-700' };

export default function CampanasCRM() {
  const [campanas, setCampanas] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [modalCrear, setModalCrear] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [form, setForm] = useState(inicial);
  const [previsualizacion, setPrevisualizacion] = useState({ cantidad: 0, pacientes: [] });
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    try {
      const [lista, templates] = await Promise.all([api.get('/crm/campanas'), api.get('/crm/plantillas-campana')]);
      setCampanas(lista.data); setPlantillas(templates.data);
    } catch (error) { toast.error(error.response?.data?.error || 'No se pudieron cargar las campañas.'); }
  };
  useEffect(() => { cargar(); }, []);

  const previsualizar = async segmento => {
    try { setPrevisualizacion((await api.post('/crm/campanas/previsualizar', { segmento })).data); }
    catch { setPrevisualizacion({ cantidad: 0, pacientes: [] }); }
  };
  const abrirCrear = () => { setForm(inicial); setModalCrear(true); previsualizar(inicial.segmento); };
  const cambiarSegmento = segmento => { setForm(actual => ({ ...actual, segmento })); previsualizar(segmento); };
  const cambiarPlantilla = id => {
    const plantilla = plantillas.find(p => Number(p.id) === Number(id));
    setForm(actual => ({ ...actual, plantilla_id: id, mensaje: plantilla?.mensaje || actual.mensaje }));
  };
  const crear = async event => {
    event.preventDefault(); setGuardando(true);
    try { await api.post('/crm/campanas', form); toast.success('Campaña guardada como borrador.'); setModalCrear(false); await cargar(); }
    catch (error) { toast.error(error.response?.data?.error || 'No se pudo crear la campaña.'); }
    finally { setGuardando(false); }
  };
  const ver = async id => {
    try { setDetalle((await api.get(`/crm/campanas/${id}`)).data); }
    catch (error) { toast.error(error.response?.data?.error || 'No se pudo abrir la campaña.'); }
  };
  const lanzar = async campana => {
    if (!window.confirm(`¿Activar “${campana.nombre}”? Los mensajes seguirán enviándose uno por uno desde WhatsApp.`)) return;
    try { await api.put(`/crm/campanas/${campana.id}/lanzar`); toast.success('Campaña activada.'); await cargar(); if (detalle?.id === campana.id) await ver(campana.id); }
    catch (error) { toast.error(error.response?.data?.error || 'No se pudo activar.'); }
  };
  const finalizar = async campana => {
    if (!window.confirm('¿Finalizar esta campaña?')) return;
    try { await api.put(`/crm/campanas/${campana.id}/finalizar`); toast.success('Campaña finalizada.'); await cargar(); await ver(campana.id); }
    catch (error) { toast.error(error.response?.data?.error || 'No se pudo finalizar.'); }
  };
  const eliminar = async campana => {
    if (!window.confirm(`¿Eliminar el borrador “${campana.nombre}”?`)) return;
    try { await api.delete(`/crm/campanas/${campana.id}`); toast.success('Borrador eliminado.'); setDetalle(null); await cargar(); }
    catch (error) { toast.error(error.response?.data?.error || 'No se pudo eliminar.'); }
  };
  const actualizarDestinatario = async (destinatario, estado, extra = {}) => {
    try { await api.put(`/crm/campanas/destinatarios/${destinatario.id}/estado`, { estado, ...extra }); await ver(detalle.id); await cargar(); }
    catch (error) { toast.error(error.response?.data?.error || 'No se pudo actualizar.'); }
  };
  const enviar = destinatario => {
    const telefono = String(destinatario.paciente?.telefono || '').replace(/\D/g, '');
    const numero = telefono.length === 10 ? `52${telefono}` : telefono;
    const mensaje = detalle.mensaje.replaceAll('{nombre}', destinatario.paciente?.nombre || '').replaceAll('{clinica}', 'Clínica Dental Almar');
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer');
    actualizarDestinatario(destinatario, 'ENVIADO');
  };
  const registrarCita = destinatario => {
    const valor = window.prompt('Ingreso atribuido a esta campaña (opcional):', '0');
    if (valor === null) return;
    actualizarDestinatario(destinatario, 'CITA', { ingreso_atribuido: Number(valor || 0) });
  };
  const totales = useMemo(() => campanas.reduce((acc, c) => ({
    destinatarios: acc.destinatarios + Number(c.metricas?.destinatarios || 0),
    enviados: acc.enviados + Number(c.metricas?.enviados || 0),
    citas: acc.citas + Number(c.metricas?.citas || 0),
    ingresos: acc.ingresos + Number(c.metricas?.ingresos || 0)
  }), { destinatarios: 0, enviados: 0, citas: 0, ingresos: 0 }), [campanas]);

  return <div className="space-y-4 animate-fade-in">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><FiVolume2 className="text-primary-600" /><h1 className="text-2xl font-extrabold text-primary-900">Campañas CRM</h1></div><p className="text-xs text-slate-400">Seguimiento por WhatsApp para pacientes que autorizaron comunicaciones</p></div><button onClick={abrirCrear} className="btn-primary"><FiPlus /> Nueva campaña</button></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[[FiUsers, 'Destinatarios', totales.destinatarios, 'bg-violet-100 text-violet-700'], [FiSend, 'Enviados', totales.enviados, 'bg-sky-100 text-sky-700'], [FiCalendar, 'Citas', totales.citas, 'bg-amber-100 text-amber-700'], [FiDollarSign, 'Ingresos atribuidos', moneda.format(totales.ingresos), 'bg-emerald-100 text-emerald-700']].map(([Icon, label, valor, color]) => <div key={label} className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm"><span className={`rounded-xl p-3 ${color}`}><Icon /></span><div className="min-w-0"><b className="block truncate text-lg">{valor}</b><span className="text-[10px] text-slate-400">{label}</span></div></div>)}</div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{!campanas.length ? <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><FiVolume2 size={40} className="mb-3 text-slate-300" /><b className="text-slate-700">Aún no hay campañas</b><p className="mt-1 max-w-md text-xs text-slate-400">Crea una campaña para un segmento. Sólo se agregarán pacientes con teléfono y consentimiento registrado.</p><button onClick={abrirCrear} className="btn-primary mt-5"><FiPlus /> Crear campaña</button></div> : <div className="divide-y divide-slate-100">{campanas.map(c => <article key={c.id} className="grid gap-3 p-4 hover:bg-slate-50 md:grid-cols-[1fr_auto_auto]"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{c.nombre}</h2><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${colorEstado[c.estado]}`}>{c.estado}</span></div><p className="mt-1 text-xs text-slate-400">Segmento: {opcionesSegmento.find(x => x[0] === c.segmento)?.[1] || c.segmento} · {new Date(c.createdAt).toLocaleDateString('es-MX')}</p></div><div className="grid grid-cols-4 gap-2 text-center text-[9px]"><div className="rounded-lg bg-slate-50 px-3 py-2"><b className="block text-sm">{c.metricas.destinatarios}</b>Pacientes</div><div className="rounded-lg bg-slate-50 px-3 py-2"><b className="block text-sm">{c.metricas.enviados}</b>Enviados</div><div className="rounded-lg bg-slate-50 px-3 py-2"><b className="block text-sm">{c.metricas.citas}</b>Citas</div><div className="rounded-lg bg-slate-50 px-3 py-2"><b className="block truncate text-xs">{moneda.format(c.metricas.ingresos)}</b>Ingresos</div></div><div className="flex items-center justify-end gap-2"><button onClick={() => ver(c.id)} className="btn-secondary !px-3 !py-2 text-xs"><FiEye /> Ver</button>{c.estado === 'BORRADOR' && <button onClick={() => lanzar(c)} className="btn-primary !px-3 !py-2 text-xs"><FiSend /> Activar</button>}</div></article>)}</div>}</section>
    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-800"><b>Envío responsable:</b> esta versión abre WhatsApp para cada paciente y registra el envío. No realiza automatización masiva ni comparte información clínica.</div>

    <Modal isOpen={modalCrear} onClose={() => setModalCrear(false)} title="Nueva campaña" size="lg"><form onSubmit={crear} className="space-y-4"><label className="block text-sm font-medium">Nombre *<input required maxLength={160} className="input-field mt-1" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Reactivación noviembre" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Segmento *<select className="input-field mt-1" value={form.segmento} onChange={e => cambiarSegmento(e.target.value)}>{opcionesSegmento.map(([clave, nombre]) => <option key={clave} value={clave}>{nombre}</option>)}</select></label><label className="text-sm font-medium">Plantilla<select className="input-field mt-1" value={form.plantilla_id} onChange={e => cambiarPlantilla(e.target.value)}><option value="">Mensaje personalizado</option>{plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label></div><div className={`rounded-xl border p-3 text-xs ${previsualizacion.cantidad ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-amber-100 bg-amber-50 text-amber-800'}`}><b>{previsualizacion.cantidad} pacientes elegibles</b><p className="mt-1">Con teléfono y consentimiento de marketing. Los demás quedan excluidos automáticamente.</p>{previsualizacion.pacientes.length > 0 && <p className="mt-2 truncate text-[10px] opacity-70">Ejemplo: {previsualizacion.pacientes.map(p => `${p.nombre} ${p.apellido}`).join(', ')}</p>}</div><label className="block text-sm font-medium">Mensaje *<textarea required rows="6" maxLength={5000} className="input-field mt-1" value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })} placeholder="Hola {nombre}, ..." /><small className="text-[10px] text-slate-400">Usa {'{nombre}'} para personalizar el saludo.</small></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setModalCrear(false)} className="btn-secondary">Cancelar</button><button disabled={guardando || !previsualizacion.cantidad} className="btn-primary">{guardando ? 'Guardando...' : 'Guardar borrador'}</button></div></form></Modal>

    <Modal isOpen={Boolean(detalle)} onClose={() => setDetalle(null)} title={detalle?.nombre || 'Campaña'} size="xl">{detalle && <div className="space-y-4"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-[10px] font-bold ${colorEstado[detalle.estado]}`}>{detalle.estado}</span><span className="text-xs text-slate-400">{detalle.metricas.destinatarios} destinatarios · {detalle.metricas.enviados} enviados · {detalle.metricas.citas} citas</span></div><div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{detalle.mensaje}</div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase text-slate-400"><tr><th className="p-3">Paciente</th><th className="p-3">Teléfono</th><th className="p-3">Estado</th><th className="p-3 text-right">Ingreso</th><th className="p-3 text-right">Acciones</th></tr></thead><tbody className="divide-y">{detalle.destinatarios.map(d => <tr key={d.id}><td className="p-3 font-semibold">{d.paciente?.nombre} {d.paciente?.apellido}</td><td className="p-3 text-slate-500">{d.paciente?.telefono}</td><td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold">{d.estado}</span></td><td className="p-3 text-right">{moneda.format(d.ingreso_atribuido || 0)}</td><td className="p-3"><div className="flex justify-end gap-1">{detalle.estado === 'ACTIVA' && <>{d.estado === 'PENDIENTE' && <button onClick={() => enviar(d)} className="rounded-lg bg-emerald-50 p-2 text-emerald-700" title="Abrir WhatsApp"><FiMessageCircle /></button>}{['ENVIADO','RESPONDIO'].includes(d.estado) && <button onClick={() => actualizarDestinatario(d, 'RESPONDIO')} className="rounded-lg bg-sky-50 p-2 text-sky-700" title="Registrar respuesta"><FiCheckCircle /></button>}{['ENVIADO','RESPONDIO'].includes(d.estado) && <button onClick={() => registrarCita(d)} className="rounded-lg bg-amber-50 p-2 text-amber-700" title="Registrar cita"><FiCalendar /></button>}</>}</div></td></tr>)}</tbody></table></div><div className="flex flex-wrap justify-between gap-2">{detalle.estado === 'BORRADOR' ? <button onClick={() => eliminar(detalle)} className="btn-danger"><FiTrash2 /> Eliminar</button> : <span />}{detalle.estado === 'BORRADOR' && <button onClick={() => lanzar(detalle)} className="btn-primary"><FiSend /> Activar campaña</button>}{detalle.estado === 'ACTIVA' && <button onClick={() => finalizar(detalle)} className="btn-primary"><FiCheckCircle /> Finalizar</button>}</div></div>}</Modal>
  </div>;
}
