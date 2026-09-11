import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const DIENTES = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28,48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
const SITIOS = ['MV', 'V', 'DV', 'ML', 'L', 'DL'];
const sitioVacio = sitio => ({ sitio, profundidad: '', recesion: '0', sangrado: false, placa: false, supuracion: false });

export default function Periodontograma({ pacienteId }) {
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
        </div>}
      </div>)}
    </div>}
  </div>;
}
