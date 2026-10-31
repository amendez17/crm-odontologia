import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiDollarSign, FiPhone, FiRefreshCw, FiUsers } from 'react-icons/fi';
import api from '../api/axios';

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export default function SegmentosCRM() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState('en_riesgo');
  const cargar = async () => {
    setLoading(true); setError('');
    try { setData((await api.get('/crm/segmentos-rfm')).data); }
    catch (err) { setError(err.response?.data?.error || 'No fue posible calcular los segmentos.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);
  if (loading) return <div className="flex h-64 items-center justify-center"><FiRefreshCw className="animate-spin text-primary-600" size={30} /></div>;
  if (error) return <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-700"><FiAlertTriangle className="mx-auto mb-2" />{error}<button onClick={cargar} className="btn-secondary mx-auto mt-4">Reintentar</button></div>;
  const actual = data.segmentos.find(s => s.clave === abierto) || data.segmentos[0];
  return <div className="space-y-4 animate-fade-in">
    <div><h1 className="text-2xl font-extrabold text-primary-900">Segmentos RFM</h1><p className="text-xs text-slate-400">Clasificación automática por recencia, frecuencia y valor registrado</p></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><div className="rounded-2xl border bg-white p-4 shadow-sm"><FiUsers className="mb-2 text-violet-600" /><b className="block text-xl">{data.metricas.pacientes}</b><span className="text-[10px] text-slate-400">Pacientes analizados</span></div><div className="rounded-2xl border bg-white p-4 shadow-sm"><FiDollarSign className="mb-2 text-emerald-600" /><b className="block truncate text-lg">{moneda.format(data.metricas.valor_total)}</b><span className="text-[10px] text-slate-400">Valor histórico</span></div><div className="rounded-2xl border bg-white p-4 shadow-sm"><FiAlertTriangle className="mb-2 text-amber-600" /><b className="block text-xl">{data.metricas.riesgo}</b><span className="text-[10px] text-slate-400">En riesgo o dormidos</span></div><div className="rounded-2xl border bg-white p-4 shadow-sm"><FiPhone className="mb-2 text-sky-600" /><b className="block text-xl">{data.metricas.recuperables}</b><span className="text-[10px] text-slate-400">Contactables</span></div></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">{data.segmentos.map(segmento => <button key={segmento.clave} onClick={() => setAbierto(segmento.clave)} className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${abierto === segmento.clave ? 'ring-2 ring-primary-400' : 'hover:-translate-y-0.5'}`}><span className="mb-3 block h-2 w-10 rounded-full" style={{ backgroundColor: segmento.color }} /><b className="block text-sm text-slate-900">{segmento.nombre}</b><span className="text-2xl font-extrabold" style={{ color: segmento.color }}>{segmento.cantidad}</span><small className="block truncate text-[9px] text-slate-400">{moneda.format(segmento.valor)}</small></button>)}</div>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">{actual.nombre}</h2><p className="text-[11px] text-slate-400">{actual.cantidad} pacientes · {moneda.format(actual.valor)}</p></div><Link to={`/crm/pacientes?segmento=${actual.clave}`} className="btn-secondary !px-3 !py-2 text-xs">Abrir lista</Link></div>{!actual.pacientes.length ? <div className="rounded-xl border border-dashed p-10 text-center text-xs text-slate-400">No hay pacientes en este segmento.</div> : <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{actual.pacientes.slice(0, 12).map(p => <Link to={`/crm/pacientes/${p.id}`} key={p.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-primary-50"><span className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white" style={{ backgroundColor: actual.color }}>{p.nombre?.[0]}{p.apellido?.[0]}</span><span className="min-w-0 flex-1"><b className="block truncate text-xs text-slate-800">{p.nombre} {p.apellido}</b><small className="text-[10px] text-slate-400">{p.visitas} visitas · {p.dias_sin_visita ?? '—'} días</small></span><b className="text-[10px] text-slate-600">{p.salud}/100</b></Link>)}</div>}</section>
    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-xs text-sky-800"><b>Cómo se calcula:</b> recencia de la última cita completada, cantidad de visitas y pagos registrados. Tener una cita futura mejora el indicador de salud. No se analiza información médica.</div>
  </div>;
}
