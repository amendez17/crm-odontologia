import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiAlertTriangle, FiChevronLeft, FiChevronRight, FiEye, FiRefreshCw, FiSearch, FiUsers } from 'react-icons/fi';
import api from '../api/axios';

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const segmentos = [
  ['campeones', 'Campeones'], ['leales', 'Leales'], ['activos', 'Activos'], ['nuevos', 'Nuevos'],
  ['en_riesgo', 'En riesgo'], ['dormidos', 'Dormidos'], ['prospectos', 'Prospectos']
];

function Salud({ valor }) {
  const color = valor >= 70 ? 'bg-emerald-500' : valor >= 45 ? 'bg-amber-500' : 'bg-red-500';
  return <div className="min-w-24"><div className="mb-1 flex justify-between text-[10px]"><span className="text-slate-400">Salud</span><b>{valor}/100</b></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${color}`} style={{ width: `${valor}%` }} /></div></div>;
}

export default function PacientesCRM() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState({ pacientes: [], total: 0, pagina: 1, paginas: 1 });
  const [filtros, setFiltros] = useState({ buscar: '', segmento: searchParams.get('segmento') || '', orden: 'salud_asc', pagina: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const respuesta = await api.get('/crm/pacientes-360', { params: { ...filtros, limite: 30 } });
        setData(respuesta.data);
      } catch (err) {
        setError(err.response?.data?.error || 'No fue posible cargar los pacientes.');
      } finally { setLoading(false); }
    }, filtros.buscar ? 300 : 0);
    return () => clearTimeout(timer);
  }, [filtros]);

  const cambiar = (campo, valor) => setFiltros(actual => ({ ...actual, [campo]: valor, pagina: campo === 'pagina' ? valor : 1 }));

  return <div className="space-y-4 animate-fade-in">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div><div className="flex items-center gap-2"><FiUsers className="text-primary-600" /><h1 className="text-2xl font-extrabold text-primary-900">Pacientes 360°</h1></div><p className="text-xs text-slate-400">Vista comercial y de seguimiento, separada del expediente clínico</p></div>
      <Link to="/crm/segmentos" className="btn-secondary !px-4 !py-2 text-xs">Ver segmentos RFM</Link>
    </div>

    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-3">
      <label className="relative sm:col-span-1"><FiSearch className="absolute left-3 top-3 text-slate-400" /><input className="input-field !pl-10" value={filtros.buscar} onChange={e => cambiar('buscar', e.target.value)} placeholder="Nombre, teléfono o número..." /></label>
      <select className="input-field" value={filtros.segmento} onChange={e => cambiar('segmento', e.target.value)}><option value="">Todos los segmentos</option>{segmentos.map(([clave, nombre]) => <option key={clave} value={clave}>{nombre}</option>)}</select>
      <select className="input-field" value={filtros.orden} onChange={e => cambiar('orden', e.target.value)}><option value="salud_asc">Menor salud primero</option><option value="salud_desc">Mayor salud primero</option><option value="valor_desc">Mayor valor</option><option value="visitas_desc">Más visitas</option><option value="nombre">Nombre</option></select>
    </div>

    {error && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"><FiAlertTriangle className="mr-2 inline" />{error}</div>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><p className="text-xs text-slate-500"><b className="text-slate-900">{data.total}</b> pacientes</p>{loading && <FiRefreshCw className="animate-spin text-primary-600" />}</div>
      {!loading && !data.pacientes.length ? <div className="p-12 text-center text-sm text-slate-400">No hay pacientes con esos filtros.</div> : <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-3">Paciente</th><th className="px-4 py-3">Segmento</th><th className="px-4 py-3">Salud</th><th className="px-4 py-3 text-center">Visitas</th><th className="px-4 py-3">Última visita</th><th className="px-4 py-3 text-right">Valor histórico</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-slate-100">{data.pacientes.map(p => <tr key={p.id} className="hover:bg-slate-50"><td className="px-4 py-3"><b className="block text-slate-800">{p.nombre} {p.apellido}</b><span className="text-[10px] text-slate-400">{p.telefono || p.email || p.dni}</span></td><td className="px-4 py-3"><span className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-white" style={{ backgroundColor: p.segmento.color }}>{p.segmento.nombre}</span></td><td className="px-4 py-3"><Salud valor={p.salud} /></td><td className="px-4 py-3 text-center font-bold">{p.visitas}</td><td className="px-4 py-3 text-slate-500">{p.ultima_visita || 'Sin visitas'}{p.dias_sin_visita !== null && <small className="block text-[9px]">Hace {p.dias_sin_visita} días</small>}</td><td className="px-4 py-3 text-right font-semibold">{moneda.format(p.valor_historico)}</td><td className="px-4 py-3"><Link to={`/crm/pacientes/${p.id}`} className="inline-flex rounded-lg border border-slate-200 p-2 text-primary-700 hover:bg-primary-50" aria-label={`Ver ficha de ${p.nombre}`}><FiEye /></Link></td></tr>)}</tbody></table></div>
        <div className="divide-y divide-slate-100 md:hidden">{data.pacientes.map(p => <Link to={`/crm/pacientes/${p.id}`} key={p.id} className="block space-y-3 p-4 hover:bg-slate-50"><div className="flex items-start justify-between gap-2"><div><b className="text-sm text-slate-900">{p.nombre} {p.apellido}</b><p className="text-[10px] text-slate-400">{p.telefono || p.email || p.dni}</p></div><span className="rounded-full px-2 py-1 text-[9px] font-semibold text-white" style={{ backgroundColor: p.segmento.color }}>{p.segmento.nombre}</span></div><Salud valor={p.salud} /><div className="grid grid-cols-3 gap-2 text-center text-[10px]"><div className="rounded-lg bg-slate-50 p-2"><b className="block text-sm">{p.visitas}</b>Visitas</div><div className="rounded-lg bg-slate-50 p-2"><b className="block truncate text-xs">{p.dias_sin_visita ?? '—'}</b>Días</div><div className="rounded-lg bg-slate-50 p-2"><b className="block truncate text-xs">{moneda.format(p.valor_historico)}</b>Valor</div></div></Link>)}</div>
      </>}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs"><button disabled={data.pagina <= 1} onClick={() => cambiar('pagina', data.pagina - 1)} className="rounded-lg border p-2 disabled:opacity-30"><FiChevronLeft /></button><span>Página {data.pagina} de {data.paginas}</span><button disabled={data.pagina >= data.paginas} onClick={() => cambiar('pagina', data.pagina + 1)} className="rounded-lg border p-2 disabled:opacity-30"><FiChevronRight /></button></div>
    </section>
  </div>;
}
