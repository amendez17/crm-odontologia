import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  FiAlertTriangle, FiCalendar, FiCheckSquare, FiChevronRight, FiDollarSign,
  FiGift, FiPhone, FiRefreshCw, FiTarget, FiTrendingUp, FiUsers, FiVolume2
} from 'react-icons/fi';

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });
const fecha = valor => valor ? new Date(`${valor}T12:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '';

const coloresSegmento = {
  frecuentes: '#10b981',
  activos: '#6366f1',
  riesgo: '#f59e0b',
  prospectos: '#94a3b8'
};

function TarjetaMetrica({ icon: Icon, etiqueta, valor, ayuda, color }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon size={19} /></span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-500">{etiqueta}</p>
          <p className="truncate text-xl font-extrabold text-slate-900">{valor}</p>
          <p className="truncate text-[10px] text-slate-400">{ayuda}</p>
        </div>
      </div>
    </div>
  );
}

function EncabezadoTarjeta({ titulo, subtitulo, enlace, textoEnlace }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold text-slate-900">{titulo}</h2>
        <p className="text-[11px] text-slate-400">{subtitulo}</p>
      </div>
      {enlace && <Link to={enlace} className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-primary-300 hover:text-primary-700">{textoEnlace}</Link>}
    </div>
  );
}

function EstadoVacio({ children }) {
  return <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center text-xs text-slate-400">{children}</div>;
}

export default function PanelCRM() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      const respuesta = await api.get('/crm/resumen');
      setData(respuesta.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No fue posible cargar el panel CRM.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const graficaSegmentos = useMemo(() => {
    const segmentos = data?.segmentos || [];
    const total = segmentos.reduce((suma, segmento) => suma + segmento.cantidad, 0);
    let acumulado = 0;
    const partes = segmentos.map(segmento => {
      const inicio = total ? (acumulado / total) * 360 : 0;
      acumulado += segmento.cantidad;
      const fin = total ? (acumulado / total) * 360 : 0;
      return `${coloresSegmento[segmento.nombre]} ${inicio}deg ${fin}deg`;
    });
    return { total, fondo: total ? `conic-gradient(${partes.join(',')})` : '#e2e8f0' };
  }, [data]);

  const whatsapp = paciente => {
    const digitos = String(paciente.telefono || '').replace(/\D/g, '');
    const numero = digitos.length === 10 ? `52${digitos}` : digitos;
    const mensaje = `Hola ${paciente.nombre}, te contactamos de Clínica Dental Almar para dar seguimiento a tu salud dental. ¿Te gustaría agendar una cita?`;
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;

  if (error) return (
    <div className="mx-auto max-w-lg rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
      <FiAlertTriangle className="mx-auto mb-3 text-red-500" size={32} />
      <h1 className="font-bold text-slate-900">No se pudo cargar el CRM</h1>
      <p className="mt-1 text-sm text-slate-500">{error}</p>
      <button onClick={cargar} className="btn-primary mt-5"><FiRefreshCw /> Reintentar</button>
    </div>
  );

  const { metricas, segmentos, requieren_atencion: atencion, agenda, cumpleanios, mejores_clientes: mejores, nuevos_por_mes: nuevos = [], campanas = [], ventas_atribuidas_mes: atribuidas = 0 } = data;
  const maxNuevos = Math.max(...nuevos.map(mes => mes.cantidad), 1);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><FiTarget className="text-primary-600" /><h1 className="text-xl font-extrabold text-primary-900 sm:text-2xl">CRM</h1></div>
          <p className="text-xs text-slate-400 sm:text-sm">Salud de pacientes, oportunidades y acciones del día</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Link to="/citas" className="btn-secondary whitespace-nowrap !px-3 !py-2 text-xs"><FiCalendar /> Nueva cita</Link>
          <Link to="/crm/pacientes" className="btn-primary whitespace-nowrap !px-3 !py-2 text-xs"><FiUsers /> Pacientes 360°</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <TarjetaMetrica icon={FiUsers} etiqueta="Pacientes activos" valor={metricas.clientes_activos.toLocaleString('es-MX')} ayuda="Cartera clínica actual" color="bg-violet-100 text-violet-700" />
        <TarjetaMetrica icon={FiRefreshCw} etiqueta="Tasa de recompra" valor={`${metricas.tasa_recompra}%`} ayuda="Pacientes con 2+ visitas" color="bg-emerald-100 text-emerald-700" />
        <TarjetaMetrica icon={FiDollarSign} etiqueta="Valor por paciente" valor={moneda.format(metricas.valor_por_cliente)} ayuda="Ingreso histórico promedio" color="bg-sky-100 text-sky-700" />
        <TarjetaMetrica icon={FiTrendingUp} etiqueta="Ticket promedio" valor={moneda.format(metricas.ticket_promedio)} ayuda="Promedio por pago registrado" color="bg-cyan-100 text-cyan-700" />
        <TarjetaMetrica icon={FiAlertTriangle} etiqueta="Pacientes en riesgo" valor={metricas.clientes_riesgo} ayuda="120+ días sin visita futura" color="bg-amber-100 text-amber-700" />
        <TarjetaMetrica icon={FiTarget} etiqueta="Pipeline ponderado" valor={moneda.format(metricas.pipeline_valor)} ayuda={`${metricas.pipeline_cantidad} oportunidades abiertas`} color="bg-rose-100 text-rose-700" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <EncabezadoTarjeta titulo="Salud de la cartera" subtitulo="Segmentación por visitas y recencia" enlace="/crm/segmentos" textoEnlace="Ver segmentos" />
          <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col 2xl:flex-row">
            <div className="relative h-32 w-32 shrink-0 rounded-full" style={{ background: graficaSegmentos.fondo }}>
              <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-white"><span className="text-xl font-extrabold text-slate-900">{graficaSegmentos.total}</span><span className="text-[9px] text-slate-400">pacientes</span></div>
            </div>
            <div className="w-full space-y-2">
              {segmentos.map(segmento => <div key={segmento.nombre} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: coloresSegmento[segmento.nombre] }} /><span className="flex-1 capitalize text-slate-600">{segmento.nombre}</span><b className="text-slate-900">{segmento.cantidad}</b></div>)}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <EncabezadoTarjeta titulo="Necesitan atención" subtitulo="Pacientes que conviene reactivar" enlace="/citas" textoEnlace="Agendar" />
          {atencion.length === 0 ? <EstadoVacio>No hay pacientes en riesgo por ahora.</EstadoVacio> : <div className="space-y-2">{atencion.slice(0, 4).map(paciente => (
            <div key={paciente.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-xs font-bold text-white">{paciente.nombre?.[0]}{paciente.apellido?.[0]}</div>
              <Link to={`/crm/pacientes/${paciente.id}`} className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-900">{paciente.nombre} {paciente.apellido}</p><p className="truncate text-[10px] text-slate-400">{paciente.dias_sin_visita} días · {moneda.format(paciente.valor_historico)} histórico</p></Link>
              {paciente.telefono && <a href={whatsapp(paciente)} target="_blank" rel="noreferrer" aria-label={`Enviar WhatsApp a ${paciente.nombre}`} className="rounded-lg border border-emerald-200 bg-white p-2 text-emerald-600 hover:bg-emerald-50"><FiPhone size={14} /></a>}
            </div>
          ))}</div>}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <EncabezadoTarjeta titulo="Mi agenda" subtitulo="Próximas citas programadas" enlace="/citas" textoEnlace="Ver todas" />
          {agenda.length === 0 ? <EstadoVacio>No hay citas próximas.</EstadoVacio> : <div className="divide-y divide-slate-100">{agenda.slice(0, 5).map(cita => (
            <Link key={cita.id} to={`/pacientes/${cita.paciente_id}`} className="flex gap-3 py-2.5 text-xs hover:text-primary-700">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
              <span className="min-w-0 flex-1"><b className="block truncate text-slate-800">{cita.paciente?.nombre} {cita.paciente?.apellido}</b><span className="block truncate text-[10px] text-slate-400">{cita.motivo || 'Consulta'} · Dr. {cita.doctor?.apellido}</span></span>
              <span className="shrink-0 text-right font-semibold text-primary-700">{fecha(cita.fecha)}<small className="block font-normal text-slate-400">{cita.hora_inicio?.slice(0, 5)}</small></span>
            </Link>
          ))}</div>}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <EncabezadoTarjeta titulo="Pipeline de atención" subtitulo="Pacientes y tratamientos en seguimiento" enlace="/crm/pipeline" textoEnlace="Abrir pipeline" />
          <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-primary-50 p-4 text-center"><p className="text-2xl font-extrabold text-primary-800">{metricas.pipeline_cantidad}</p><p className="text-[10px] uppercase tracking-wide text-primary-500">Oportunidades</p></div><div className="rounded-xl bg-emerald-50 p-4 text-center"><p className="truncate text-lg font-extrabold text-emerald-800">{moneda.format(metricas.pipeline_valor)}</p><p className="text-[10px] uppercase tracking-wide text-emerald-600">Valor total</p></div></div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <EncabezadoTarjeta titulo="Cumpleaños próximos" subtitulo="Siguientes 14 días" />
          {cumpleanios.length === 0 ? <EstadoVacio>No hay cumpleaños próximos.</EstadoVacio> : <div className="space-y-2">{cumpleanios.map(paciente => <Link to={`/crm/pacientes/${paciente.id}`} key={paciente.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-amber-50"><span className="rounded-lg bg-amber-100 p-2 text-amber-600"><FiGift /></span><span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">{paciente.nombre} {paciente.apellido}</span><span className="text-[10px] font-medium text-amber-700">{paciente.dias === 0 ? 'Hoy' : `En ${paciente.dias} días`}</span></Link>)}</div>}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm lg:col-span-2 xl:col-span-1">
          <EncabezadoTarjeta titulo="Mejores pacientes" subtitulo="Por valor histórico registrado" enlace="/pagos" textoEnlace="Ver pagos" />
          {mejores.length === 0 ? <EstadoVacio>Aún no hay pagos para calcular este ranking.</EstadoVacio> : <div className="space-y-1">{mejores.map((paciente, indice) => <Link to={`/crm/pacientes/${paciente.id}`} key={paciente.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50"><span className="w-4 text-xs font-bold text-slate-400">{indice + 1}</span><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-[10px] font-bold text-white">{paciente.nombre?.[0]}{paciente.apellido?.[0]}</span><span className="min-w-0 flex-1"><b className="block truncate text-xs text-slate-800">{paciente.nombre} {paciente.apellido}</b><small className="text-[10px] text-slate-400">{paciente.visitas} visitas</small></span><b className="text-xs text-slate-900">{moneda.format(paciente.total)}</b><FiChevronRight className="text-slate-300" /></Link>)}</div>}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm xl:col-span-2">
          <EncabezadoTarjeta titulo="Campañas recientes" subtitulo={`Citas y pagos atribuidos este mes: ${moneda.format(atribuidas)}`} />
          {campanas.length === 0 ? <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-4 text-center"><FiVolume2 size={30} className="mb-3 text-slate-300" /><p className="text-sm text-slate-500">Aún no has lanzado campañas.</p><p className="mt-1 text-[11px] text-slate-400">Próximamente podrás crear campañas por segmento y medir sus resultados.</p></div> : <div className="table-responsive"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-100 text-slate-400"><th className="p-2">Campaña</th><th className="p-2">Segmento</th><th className="p-2 text-right">Enviados</th><th className="p-2 text-right">Citas</th><th className="p-2 text-right">Ingresos</th></tr></thead><tbody>{campanas.map(campana => <tr key={campana.id} className="border-b border-slate-50"><td className="p-2 font-semibold text-slate-800">{campana.nombre}</td><td className="p-2 text-slate-500">{campana.segmento}</td><td className="p-2 text-right">{campana.enviados}</td><td className="p-2 text-right">{campana.citas}</td><td className="p-2 text-right font-semibold">{moneda.format(campana.ingresos)}</td></tr>)}</tbody></table></div>}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <EncabezadoTarjeta titulo="Pacientes nuevos" subtitulo="Registrados por mes" />
          <div className="flex h-48 items-end gap-2 border-b border-l border-slate-200 px-2 pt-4">
            {nuevos.map(mes => <div key={mes.clave} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-semibold text-primary-700">{mes.cantidad || ''}</span><div className="w-full max-w-8 rounded-t-lg bg-gradient-to-t from-primary-600 to-violet-500 transition-all duration-700" style={{ height: `${mes.cantidad ? Math.max((mes.cantidad / maxNuevos) * 80, 8) : 1}%`, opacity: mes.cantidad ? 1 : 0.15 }} /><span className="pb-2 text-[10px] text-slate-500">{mes.etiqueta}</span></div>)}
          </div>
        </section>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-primary-100 bg-primary-50/70 px-4 py-3 text-xs text-primary-800"><FiCheckSquare className="shrink-0" /><span>Esta primera etapa usa únicamente información existente; no modifica expedientes, citas, pagos ni tratamientos.</span></div>
    </div>
  );
}
