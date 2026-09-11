import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { FiPrinter } from 'react-icons/fi';

const DIENTES = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28,48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
const SITIOS = ['MV', 'V', 'DV', 'ML', 'L', 'DL'];
const sitioVacio = sitio => ({ sitio, profundidad: '', recesion: '0', sangrado: false, placa: false, supuracion: false });

export default function Periodontograma({ pacienteId, paciente }) {
  const [pieza, setPieza] = useState(18);
  const [mediciones, setMediciones] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [evaluacionAbierta, setEvaluacionAbierta] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => api.get(`/periodontograma/${pacienteId}`).then(res => {
    setEvaluaciones(res.data);
    setEvaluacionAbierta(actual => actual || res.data[0]?.id || null);
  }).catch(() => toast.error('No se pudo cargar el periodontograma'));
  useEffect(() => { cargar(); }, [pacienteId]);

  const datosPieza = mediciones[pieza] || { sitios: SITIOS.map(sitioVacio), movilidad: '0', furca: '0' };
  const actualizarSitio = (indice, campo, valor) => setMediciones(actual => ({
    ...actual,
    [pieza]: { ...datosPieza, sitios: datosPieza.sitios.map((sitio, i) => i === indice ? { ...sitio, [campo]: valor } : sitio) }
  }));
  const actualizarPieza = (campo, valor) => setMediciones(actual => ({ ...actual, [pieza]: { ...datosPieza, [campo]: valor } }));

  const guardar = async () => {
    const registros = Object.entries(mediciones).filter(([, data]) => data.sitios.some(s => s.profundidad !== '')).map(([numero, data]) => ({
      pieza: Number(numero), movilidad: Number(data.movilidad || 0), furca: Number(data.furca || 0),
      sitios: data.sitios.map(s => ({ ...s, profundidad: Number(s.profundidad || 0), recesion: Number(s.recesion || 0) }))
    }));
    if (!registros.length) return toast.error('Captura al menos una profundidad de sondaje');
    setGuardando(true);
    try {
      await api.post('/periodontograma', { paciente_id: Number(pacienteId), mediciones: registros, observaciones });
      toast.success('Evaluación periodontal guardada');
      setMediciones({}); setObservaciones(''); cargar();
    } catch (error) { toast.error(error.response?.data?.error || 'No se pudo guardar'); }
    finally { setGuardando(false); }
  };

  const imprimirEvaluacion = evaluacion => {
    const win = window.open('', '_blank', 'width=900,height=900');
    if (!win) return toast.error('Permite las ventanas emergentes para imprimir');
    const seguro = valor => String(valor ?? '').replace(/[&<>'"]/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[caracter]));
    const piezas = (evaluacion.mediciones || []).map(medicion => `
      <section class="pieza"><h3>Pieza ${seguro(medicion.pieza)} <small>Movilidad: ${seguro(medicion.movilidad ?? 0)} · Furca: ${seguro(medicion.furca ?? 0)}</small></h3>
      <table><thead><tr><th>Sitio</th><th>Profundidad</th><th>Recesión</th><th>NIC</th><th>Sangrado</th><th>Placa</th><th>Supuración</th></tr></thead><tbody>
      ${(medicion.sitios || []).map(sitio => `<tr><td>${seguro(sitio.sitio)}</td><td>${seguro(sitio.profundidad)} mm</td><td>${seguro(sitio.recesion)} mm</td><td>${Number(sitio.profundidad || 0) + Number(sitio.recesion || 0)} mm</td><td>${sitio.sangrado ? 'Sí' : 'No'}</td><td>${sitio.placa ? 'Sí' : 'No'}</td><td>${sitio.supuracion ? 'Sí' : 'No'}</td></tr>`).join('')}
      </tbody></table></section>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Periodontograma - ${seguro(paciente?.nombre || pacienteId)}</title><style>
      @page{size:Letter;margin:10mm}body{font-family:Arial,sans-serif;color:#263248;font-size:10px;margin:0}.header{text-align:center;border-bottom:2px solid #c8a24a;padding-bottom:8px}.logo{width:58px}.header h1{font-size:17px;color:#b58b23;margin:2px}.header p{margin:2px}.paciente{display:flex;justify-content:space-between;gap:12px;margin:12px 0;padding:9px;background:#fffaf0;border-left:4px solid #c8a24a}.pieza{page-break-inside:avoid;margin:10px 0}.pieza h3{font-size:11px;background:#f8f4e8;padding:6px;margin:0;border:1px solid #e5d8b0}.pieza small{float:right;font-weight:normal}table{width:100%;border-collapse:collapse}th,td{border:1px solid #e5e7eb;padding:5px;text-align:center}th{color:#72591d}.observaciones{margin:10px 0;padding:8px;border:1px solid #e5e7eb}.sello{font:7px monospace;overflow-wrap:anywhere;color:#64748b}.firma{margin:38px 0 0 auto;width:260px;text-align:center;border-top:1px solid #64748b;padding-top:5px}.footer{text-align:center;border-top:1px solid #ddd;margin-top:15px;padding-top:6px;color:#64748b;font-size:8px}
    </style></head><body><div class="header"><img src="/logo_clinica-removebg-preview.png" class="logo"><h1>Clínica Dental Almar</h1><p>Evaluación periodontal</p></div>
      <div class="paciente"><span><b>Paciente:</b> ${seguro([paciente?.nombre, paciente?.apellido].filter(Boolean).join(' ') || pacienteId)}</span><span><b>Fecha:</b> ${seguro(new Date(evaluacion.fecha_hora).toLocaleString('es-MX'))}</span><span><b>Odontólogo:</b> ${seguro(evaluacion.doctor_nombre)}</span></div>
      ${evaluacion.observaciones ? `<div class="observaciones"><b>Observaciones:</b> ${seguro(evaluacion.observaciones)}</div>` : ''}${piezas}
      ${evaluacion.doctor_cedula ? `<p><b>Cédula profesional:</b> ${seguro(evaluacion.doctor_cedula)}</p>` : ''}<p class="sello"><b>Sello de integridad:</b> ${seguro(evaluacion.firma_hash)}</p>
      <div class="firma">Nombre, firma y cédula del odontólogo</div><div class="footer">${evaluacion.integridad_valida ? 'Integridad electrónica verificada' : 'Registro pendiente de revisión de integridad'} · Impreso ${new Date().toLocaleString('es-MX')}</div>
    </body></html>`);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  return <div className="space-y-5">
    <div>
      <h3 className="font-semibold text-primary-900">Periodontograma</h3>
      <p className="text-xs text-surface-500">Nueva evaluación inmutable · seis sitios por pieza</p>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {DIENTES.map(numero => <button key={numero} type="button" onClick={() => setPieza(numero)} className={`w-10 h-9 rounded-lg text-xs font-semibold border ${pieza === numero ? 'bg-primary-600 text-white border-primary-600' : mediciones[numero] ? 'bg-green-50 text-green-700 border-green-300' : 'bg-white text-surface-600 border-surface-200'}`}>{numero}</button>)}
    </div>
    <div className="border border-surface-200 rounded-xl overflow-x-auto">
      <div className="p-3 bg-surface-50 font-semibold text-sm">Pieza {pieza}</div>
      <table className="w-full text-xs min-w-[700px]">
        <thead><tr className="border-b"><th className="p-2 text-left">Sitio</th><th>Profundidad mm</th><th>Recesión mm</th><th>Sangrado</th><th>Placa</th><th>Supuración</th></tr></thead>
        <tbody>{datosPieza.sitios.map((sitio, indice) => <tr key={sitio.sitio} className="border-b last:border-0">
          <td className="p-2 font-semibold">{sitio.sitio}</td>
          <td className="p-2"><input type="number" min="0" max="15" value={sitio.profundidad} onChange={e => actualizarSitio(indice, 'profundidad', e.target.value)} className="input-field py-1" /></td>
          <td className="p-2"><input type="number" min="-10" max="15" value={sitio.recesion} onChange={e => actualizarSitio(indice, 'recesion', e.target.value)} className="input-field py-1" /></td>
          {['sangrado','placa','supuracion'].map(campo => <td key={campo} className="text-center"><input type="checkbox" checked={sitio[campo]} onChange={e => actualizarSitio(indice, campo, e.target.checked)} /></td>)}
        </tr>)}</tbody>
      </table>
      <div className="grid grid-cols-2 gap-3 p-3 border-t">
        <label className="text-xs">Movilidad (0–3)<input type="number" min="0" max="3" value={datosPieza.movilidad} onChange={e => actualizarPieza('movilidad', e.target.value)} className="input-field mt-1" /></label>
        <label className="text-xs">Furca (0–3)<input type="number" min="0" max="3" value={datosPieza.furca} onChange={e => actualizarPieza('furca', e.target.value)} className="input-field mt-1" /></label>
      </div>
    </div>
    <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} className="input-field" rows={2} placeholder="Observaciones generales de la evaluación periodontal" />
    <button type="button" onClick={guardar} disabled={guardando} className="btn-primary">{guardando ? 'Guardando…' : 'Guardar evaluación periodontal'}</button>

    {evaluaciones.length > 0 && <div className="space-y-2">
      <h4 className="font-semibold text-sm">Evaluaciones anteriores</h4>
      {evaluaciones.map(e => <div key={e.id} className="rounded-xl border border-surface-200 text-sm overflow-hidden">
        <button type="button" onClick={() => setEvaluacionAbierta(evaluacionAbierta === e.id ? null : e.id)} className="w-full p-3 text-left hover:bg-surface-50">
          <div className="flex flex-wrap justify-between gap-2"><span>{new Date(e.fecha_hora).toLocaleString('es-MX')} · Dr. {e.doctor_nombre}</span><span className={e.integridad_valida ? 'text-green-600' : 'text-red-600'}>{e.integridad_valida ? 'Integridad verificada' : 'Revisar integridad'}</span></div>
          <p className="text-xs text-surface-500 mt-1">{e.mediciones.length} pieza{e.mediciones.length !== 1 ? 's' : ''} evaluada{e.mediciones.length !== 1 ? 's' : ''} · {evaluacionAbierta === e.id ? 'Ocultar detalles' : 'Ver detalles'}</p>
        </button>
        {evaluacionAbierta === e.id && <div className="border-t border-surface-200 p-3 space-y-4 bg-white">
          {e.observaciones && <p className="text-xs"><span className="font-semibold">Observaciones:</span> {e.observaciones}</p>}
          {(e.mediciones || []).map(medicion => <div key={medicion.pieza} className="border border-surface-200 rounded-lg overflow-x-auto">
            <div className="px-3 py-2 bg-surface-50 font-semibold">Pieza {medicion.pieza} · Movilidad {medicion.movilidad ?? 0} · Furca {medicion.furca ?? 0}</div>
            <table className="w-full min-w-[650px] text-xs">
              <thead><tr className="border-b"><th className="p-2 text-left">Sitio</th><th>Profundidad</th><th>Recesión</th><th>NIC</th><th>Sangrado</th><th>Placa</th><th>Supuración</th></tr></thead>
              <tbody>{(medicion.sitios || []).map(sitio => <tr key={sitio.sitio} className="border-b last:border-0 text-center">
                <td className="p-2 text-left font-semibold">{sitio.sitio}</td>
                <td>{sitio.profundidad} mm</td><td>{sitio.recesion} mm</td><td>{Number(sitio.profundidad || 0) + Number(sitio.recesion || 0)} mm</td>
                <td>{sitio.sangrado ? 'Sí' : 'No'}</td><td>{sitio.placa ? 'Sí' : 'No'}</td><td>{sitio.supuracion ? 'Sí' : 'No'}</td>
              </tr>)}</tbody>
            </table>
          </div>)}
          {e.doctor_cedula && <p className="text-xs text-surface-500">Cédula profesional: {e.doctor_cedula}</p>}
          <p className="text-[10px] text-surface-400 break-all">Sello: {e.firma_hash}</p>
          <button type="button" onClick={() => imprimirEvaluacion(e)} className="btn-secondary inline-flex items-center gap-2 text-sm"><FiPrinter size={15} /> Imprimir evaluación</button>
        </div>}
      </div>)}
    </div>}
  </div>;
}
