import { useState, useEffect, useMemo } from 'react';

const COLORES = {
  sano: { fill: '#e8f5e9', stroke: '#4caf50', label: '#2e7d32' },
  caries: { fill: '#ffcdd2', stroke: '#e53935', label: '#b71c1c' },
  obturacion: { fill: '#bbdefb', stroke: '#1e88e5', label: '#0d47a1' },
  corona: { fill: '#fff3e0', stroke: '#fb8c00', label: '#e65100' },
  extraccion: { fill: '#cfd8dc', stroke: '#546e7a', label: '#37474f' },
  endodoncia: { fill: '#e1bee7', stroke: '#8e24aa', label: '#4a148c' },
  implante: { fill: '#b2ebf2', stroke: '#00acc1', label: '#006064' },
  protesis: { fill: '#f8bbd0', stroke: '#d81b60', label: '#880e4f' },
  ausente: { fill: '#f5f5f5', stroke: '#bdbdbd', label: '#757575' },
  fractura: { fill: '#ffe0b2', stroke: '#f4511e', label: '#bf360c' }
};

const LABELS = {
  sano: 'Sano', caries: 'Caries', obturacion: 'Obturación', corona: 'Corona',
  extraccion: 'Extracción', endodoncia: 'Endodoncia', implante: 'Implante',
  protesis: 'Prótesis', ausente: 'Ausente', fractura: 'Fractura'
};

const ESTADOS_POR_MODO = {
  diente: ['sano', 'corona', 'extraccion', 'endodoncia', 'implante', 'protesis', 'ausente'],
  cara: ['sano', 'caries', 'obturacion', 'fractura']
};

const DIENTES_SUPERIOR = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const DIENTES_INFERIOR = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
const nombreCara = (cara, pieza) => {
  if (cara === 'completa') return 'Diente completo';
  if (cara === 'lingual') return Number(pieza) < 30 ? 'Palatina' : 'Lingual';
  return cara.charAt(0).toUpperCase() + cara.slice(1);
};

// Tooth types by position for SVG rendering
const TIPO_DIENTE = {
  // Molars
  18:'molar',17:'molar',16:'molar',28:'molar',27:'molar',26:'molar',
  48:'molar',47:'molar',46:'molar',38:'molar',37:'molar',36:'molar',
  // Premolars
  15:'premolar',14:'premolar',25:'premolar',24:'premolar',
  45:'premolar',44:'premolar',35:'premolar',34:'premolar',
  // Canines
  13:'canino',23:'canino',43:'canino',33:'canino',
  // Incisors
  12:'incisivo',11:'incisivo',21:'incisivo',22:'incisivo',
  42:'incisivo',41:'incisivo',31:'incisivo',32:'incisivo'
};

// SVG tooth with 5 clickable surfaces
function DienteGrafico({ numero, estado, caras, estadoSeleccionado, onCaraClick, onDienteClick, readOnly, esInferior }) {
  const tipo = TIPO_DIENTE[numero] || 'molar';
  const color = COLORES[estado] || COLORES.sano;
  const esAusente = estado === 'ausente';

  const getCaraColor = (cara) => {
    const estadoCara = caras?.[cara];
    if (estadoCara && estadoCara !== 'sano') return COLORES[estadoCara];
    return null;
  };

 const handleCaraClick = (cara, e) => {
    if (readOnly || esAusente) return;
    onCaraClick?.(numero, cara, estadoSeleccionado);
  };
  
  const handleDienteClick = () => {
    if (readOnly) return;
    onDienteClick?.(numero, estadoSeleccionado);
  };

  // Render tooth shape based on type
  const renderRaiz = () => {
    const raizColor = esAusente ? '#e0e0e0' : '#f5e6d3';
    const raizStroke = esAusente ? '#bdbdbd' : '#d4a574';

    if (tipo === 'molar') {
      // Superiores: tres raíces hacia arriba. Inferiores: dos hacia abajo.
      if (!esInferior) {
        return (
          <g>
            <path d="M8,24 L6,4 Q6,2 8,2 L12,2 Q14,2 13,4 L15,24 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>
            <path d="M18,24 L19,2 Q19,0 21,0 L23,0 Q25,0 25,2 L26,24 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>
            <path d="M30,24 L31,4 Q30,2 32,2 L36,2 Q38,2 38,4 L36,24 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>
          </g>
        );
      }
      return (
        <g>
          <path d="M12,40 L14,62 Q14,64 16,64 L19,64 Q21,64 20,62 L21,40 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>
          <path d="M25,40 L26,62 Q25,64 27,64 L30,64 Q32,64 32,62 L34,40 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>
        </g>
      );
    } else if (tipo === 'premolar') {
      if (!esInferior) return (
        <g>
          <path d="M13,24 L12,4 Q12,2 14,2 L17,2 Q19,2 19,4 L20,24 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>
          <path d="M24,24 L25,4 Q25,2 27,2 L30,2 Q32,2 31,4 L31,24 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>
        </g>
      );
      return <path d="M18,40 L18,62 Q18,64 20,64 L23,64 Q25,64 25,62 L26,40 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>;
    } else if (tipo === 'canino') {
      if (!esInferior) return <path d="M16,24 L17,2 Q17,0 19,0 L22,0 Q24,0 24,2 L25,24 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>;
      return <path d="M16,40 L17,63 Q17,65 19,65 L22,65 Q24,65 24,63 L25,40 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>;
    } else {
      // Incisors
      if (!esInferior) return <path d="M16,24 L17,4 Q17,2 19,2 L21,2 Q23,2 23,4 L24,24 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>;
      return <path d="M16,40 L17,61 Q17,63 19,63 L21,63 Q23,63 23,61 L24,40 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>;
    }
  };

  // Crown with 5 surfaces
   const renderCorona = () => {
    const size = tipo === 'molar' ? 44 : tipo === 'premolar' ? 40 : 36;
    const cx = size / 2 + (44 - size) / 2;
    const cy = esInferior ? 22 : 42;
    const r = size / 2 - 2;
    const ri = r * 0.45; // inner radius for oclusal

    const baseStroke = esAusente ? '#bdbdbd' : '#8d6e63';
    const baseFill = esAusente ? '#f0f0f0' : '#fef9f4';

    // Color del diente completo (cuando estado != sano y no es ausente)
    const dienteEstadoActivo = estado && estado !== 'sano' && !esAusente;
    const dienteFill = dienteEstadoActivo ? color.fill : baseFill;
    const dienteStroke = dienteEstadoActivo ? color.stroke : baseStroke;

    // Surface paths using diamond/cross pattern
    const topColor = getCaraColor('vestibular');
    // Se almacena como "lingual" para mantener compatibilidad con el modelo;
    // clínicamente se presenta como palatina en la arcada superior.
    const bottomColor = getCaraColor('lingual');
    const leftColor = getCaraColor('mesial');
    const rightColor = getCaraColor('distal');
    const centerColor = getCaraColor('oclusal');



    return (
  <g>
    {/* Tooth crown base */}
    <rect x={cx-r} y={cy-r} width={r*2} height={r*2} rx={tipo === 'molar' ? 4 : tipo === 'incisivo' ? 2 : 3} ry={tipo === 'molar' ? 4 : tipo === 'incisivo' ? 2 : 3} fill={dienteFill} stroke={dienteStroke} strokeWidth={dienteEstadoActivo ? '2' : '1.2'}/>

        {/* Top surface (vestibular) */}
        <path
          d={`M${cx-r},${cy-r} L${cx+r},${cy-r} L${cx+ri},${cy-ri} L${cx-ri},${cy-ri} Z`}
          fill={topColor ? topColor.fill : 'transparent'}
          stroke={topColor ? topColor.stroke : baseStroke}
          strokeWidth={topColor ? '1.5' : '0.5'}
          className={!readOnly && !esAusente ? 'cursor-pointer hover:opacity-75' : ''}
          onClick={(e) => handleCaraClick('vestibular', e)}
        />

        {/* Bottom surface (palatino/lingual) */}
        <path
          d={`M${cx-r},${cy+r} L${cx+r},${cy+r} L${cx+ri},${cy+ri} L${cx-ri},${cy+ri} Z`}
          fill={bottomColor ? bottomColor.fill : 'transparent'}
          stroke={bottomColor ? bottomColor.stroke : baseStroke}
          strokeWidth={bottomColor ? '1.5' : '0.5'}
          className={!readOnly && !esAusente ? 'cursor-pointer hover:opacity-75' : ''}
          onClick={(e) => handleCaraClick('lingual', e)}
        />

        {/* Left surface (mesial) */}
        <path
          d={`M${cx-r},${cy-r} L${cx-ri},${cy-ri} L${cx-ri},${cy+ri} L${cx-r},${cy+r} Z`}
          fill={leftColor ? leftColor.fill : 'transparent'}
          stroke={leftColor ? leftColor.stroke : baseStroke}
          strokeWidth={leftColor ? '1.5' : '0.5'}
          className={!readOnly && !esAusente ? 'cursor-pointer hover:opacity-75' : ''}
          onClick={(e) => handleCaraClick('mesial', e)}
        />

        {/* Right surface (distal) */}
        <path
          d={`M${cx+r},${cy-r} L${cx+ri},${cy-ri} L${cx+ri},${cy+ri} L${cx+r},${cy+r} Z`}
          fill={rightColor ? rightColor.fill : 'transparent'}
          stroke={rightColor ? rightColor.stroke : baseStroke}
          strokeWidth={rightColor ? '1.5' : '0.5'}
          className={!readOnly && !esAusente ? 'cursor-pointer hover:opacity-75' : ''}
          onClick={(e) => handleCaraClick('distal', e)}
        />

        {/* Center surface (oclusal) */}
        <rect
          x={cx-ri} y={cy-ri} width={ri*2} height={ri*2}
          rx={2} ry={2}
          fill={centerColor ? centerColor.fill : 'transparent'}
          stroke={centerColor ? centerColor.stroke : baseStroke}
          strokeWidth={centerColor ? '1.5' : '0.5'}
          className={!readOnly && !esAusente ? 'cursor-pointer hover:opacity-75' : ''}
          onClick={(e) => handleCaraClick('oclusal', e)}
        />

        {/* X mark for extracted/absent teeth */}
        {(estado === 'extraccion' || estado === 'ausente') && (
          <g stroke={COLORES[estado].stroke} strokeWidth="2" opacity="0.7">
            <line x1={cx-r+2} y1={cy-r+2} x2={cx+r-2} y2={cy+r-2} />
            <line x1={cx+r-2} y1={cy-r+2} x2={cx-r+2} y2={cy+r-2} />
          </g>
        )}

        {/* Special markers */}
        {estado === 'implante' && (
          <circle cx={cx} cy={cy} r={ri-1} fill="none" stroke={COLORES.implante.stroke} strokeWidth="2" strokeDasharray="3,2"/>
        )}
        {estado === 'endodoncia' && (
          <g stroke={COLORES.endodoncia.stroke} strokeWidth="1.5">
            <line x1={cx} y1={cy-ri+2} x2={cx} y2={cy+ri-2}/>
            <line x1={cx-ri+2} y1={cy} x2={cx+ri-2} y2={cy}/>
          </g>
        )}
      </g>
    );
  };
  
  const svgHeight = 66;
  const svgWidth = 44;

  return (
    <div className="flex flex-col items-center group" style={{ width: 50 }}>
      {/* Number on top for inferior, bottom for superior */}
      {esInferior && (
        <span className={`text-[10px] font-bold mb-0.5 transition-colors ${
          estado !== 'sano' ? 'text-primary-700' : 'text-surface-500'
        } group-hover:text-primary-600`}>{numero}</span>
      )}
      <svg
        width={svgWidth} height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className={`${!readOnly ? 'cursor-pointer' : ''} transition-transform group-hover:scale-105`}
        onClick={handleDienteClick}
      >
        {renderRaiz()}
        {renderCorona()}
      </svg>
      {!esInferior && (
        <span className={`text-[10px] font-bold mt-0.5 transition-colors ${
          estado !== 'sano' ? 'text-primary-700' : 'text-surface-500'
        } group-hover:text-primary-600`}>{numero}</span>
      )}
    </div>
  );
}

export default function Odontograma({ registros = [], onPiezaClick, readOnly = false }) {
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('corona');
  const [modoAplicacion, setModoAplicacion] = useState('diente'); // 'diente' | 'cara'
  const [observacion, setObservacion] = useState('');
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [cambioPendiente, setCambioPendiente] = useState(null);
  const [filtroPieza, setFiltroPieza] = useState('todas');

  // Hidrata caras por diente desde registros del backend (cara !== 'completa')
  const carasPorDiente = useMemo(() => {
    const map = {};
    [...registros].sort((a, b) => b.id - a.id).forEach(r => {
      const cara = r.cara || 'completa';
      if (cara === 'completa') return;
      if (!map[r.pieza_dental]) map[r.pieza_dental] = {};
      // El API devuelve también versiones históricas. La primera por pieza/cara
      // es la más reciente y no debe ser reemplazada por una versión anterior.
      if (map[r.pieza_dental][cara] === undefined) map[r.pieza_dental][cara] = r.estado;
    });
    return map;
  }, [registros]);

  const getEstadoPieza = (pieza) => {
    // Si hay duplicados, usar el de mayor id (el más reciente)
    const reg = registros
      .filter(r => r.pieza_dental === pieza && (r.cara || 'completa') === 'completa')
      .sort((a, b) => b.id - a.id)[0];
    return reg ? reg.estado : 'sano';
  };

  const idsVigentes = useMemo(() => {
    const claves = new Set();
    const ids = new Set();
    [...registros].sort((a, b) => b.id - a.id).forEach(registro => {
      const clave = `${registro.pieza_dental}-${registro.cara || 'completa'}`;
      if (!claves.has(clave)) { claves.add(clave); ids.add(registro.id); }
    });
    return ids;
  }, [registros]);
  const piezasConHistorial = useMemo(() => [...new Set(registros.map(registro => Number(registro.pieza_dental)))].sort((a, b) => a - b), [registros]);
  const registrosHistorial = filtroPieza === 'todas' ? registros : registros.filter(registro => Number(registro.pieza_dental) === Number(filtroPieza));

  const handleDienteClick = (numero) => {
    if (readOnly) return;
    if (modoAplicacion === 'diente') {
      setCambioPendiente({ pieza: numero, estado: estadoSeleccionado, cara: 'completa', observacion: observacion.trim() || null });
    }
  };

  const handleCaraClick = (numero, cara, estado) => {
    if (readOnly || modoAplicacion !== 'cara') return;
    const actual = carasPorDiente[numero]?.[cara];
    const nuevoEstado = actual === estado ? 'sano' : estado;
    // Envía un registro por (pieza + cara) — coincide con el modelo Sequelize
    setCambioPendiente({ pieza: numero, estado: nuevoEstado, cara, observacion: observacion.trim() || null });
  };

  const confirmarCambio = async () => {
    if (!cambioPendiente) return;
    const guardado = await onPiezaClick?.(cambioPendiente.pieza, {
      estado: cambioPendiente.estado,
      cara: cambioPendiente.cara,
      observacion: cambioPendiente.observacion
    });
    if (guardado !== false) {
      setCambioPendiente(null);
      setObservacion('');
    }
  };

  const cambiarModo = modo => {
    setModoAplicacion(modo);
    setEstadoSeleccionado(modo === 'diente' ? 'corona' : 'caries');
  };

  return (
    <div className="space-y-5">
      {!readOnly && (
        <div className="space-y-3">
          {/* Mode selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Modo:</span>
            <div className="flex bg-surface-100 rounded-xl p-0.5">
              <button
                onClick={() => cambiarModo('diente')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${modoAplicacion === 'diente' ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-500'}`}
              >
                Diente completo
              </button>
              <button
                onClick={() => cambiarModo('cara')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${modoAplicacion === 'cara' ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-500'}`}
              >
                Por cara
              </button>
            </div>
          </div>

          {/* Estado selector */}
          <div className="flex flex-wrap gap-1.5">
            {ESTADOS_POR_MODO[modoAplicacion].map(key => (
              <button
                key={key}
                onClick={() => setEstadoSeleccionado(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all ${
                  estadoSeleccionado === key
                    ? 'border-current shadow-md scale-105'
                    : 'border-transparent bg-white/80 hover:bg-white shadow-sm'
                }`}
                style={estadoSeleccionado === key ? {
                  backgroundColor: COLORES[key].fill,
                  color: COLORES[key].label,
                  borderColor: COLORES[key].stroke
                } : {}}
              >
                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORES[key].stroke }} />
                {LABELS[key]}
              </button>
            ))}
          </div>
          <label className="block text-xs font-medium text-surface-600">
            Observación clínica del cambio (opcional)
            <input
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              className="input-field mt-1"
              placeholder="Ej. caries activa, restauración filtrada, pieza indicada para extracción"
              maxLength={1000}
            />
          </label>
        </div>
      )}

      {/* Dental chart */}
      <div className="bg-gradient-to-b from-surface-50 to-white rounded-2xl p-5 border border-surface-200">
        {/* Superior arch */}
        <div className="mb-1">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px flex-1 bg-surface-200" />
            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-[0.2em]">Arcada Superior</span>
            <div className="h-px flex-1 bg-surface-200" />
          </div>
          <div className="flex justify-center gap-0 overflow-x-auto pb-2">
            {DIENTES_SUPERIOR.map((num, i) => (
              <div key={num} className="flex items-end">
                <DienteGrafico
                  numero={num}
                  estado={getEstadoPieza(num)}
                  caras={carasPorDiente[num]}
                  estadoSeleccionado={estadoSeleccionado}
                  onCaraClick={handleCaraClick}
                  onDienteClick={handleDienteClick}
                  readOnly={readOnly}
                  esInferior={false}
                />
                {i === 7 && <div className="w-6 border-l-2 border-dashed border-primary-300 h-16 mx-1 self-center" />}
              </div>
            ))}
          </div>
        </div>

        {/* Divider - midline */}
        <div className="flex items-center my-3">
          <div className="flex-1 border-t-2 border-surface-300 border-dashed" />
          <div className="mx-3 w-8 h-8 rounded-full bg-primary-50 border-2 border-primary-200 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-400">L.M</span>
          </div>
          <div className="flex-1 border-t-2 border-surface-300 border-dashed" />
        </div>

        {/* Inferior arch */}
        <div className="mt-1">
          <div className="flex justify-center gap-0 overflow-x-auto pt-2">
            {DIENTES_INFERIOR.map((num, i) => (
              <div key={num} className="flex items-start">
                <DienteGrafico
                  numero={num}
                  estado={getEstadoPieza(num)}
                  caras={carasPorDiente[num]}
                  estadoSeleccionado={estadoSeleccionado}
                  onCaraClick={handleCaraClick}
                  onDienteClick={handleDienteClick}
                  readOnly={readOnly}
                  esInferior={true}
                />
                {i === 7 && <div className="w-6 border-l-2 border-dashed border-primary-300 h-16 mx-1 self-center" />}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px flex-1 bg-surface-200" />
            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-[0.2em]">Arcada Inferior</span>
            <div className="h-px flex-1 bg-surface-200" />
          </div>
        </div>
      </div>

      {cambioPendiente && !readOnly && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Confirmar registro clínico</p>
          <p className="mt-1 text-sm text-amber-800">
            Pieza {cambioPendiente.pieza} · {nombreCara(cambioPendiente.cara, cambioPendiente.pieza)} · {LABELS[cambioPendiente.estado]}
          </p>
          {cambioPendiente.observacion && <p className="mt-1 text-xs text-amber-700">Observación: {cambioPendiente.observacion}</p>}
          <p className="mt-2 text-xs text-amber-700">Al confirmar se conservará como parte del historial del expediente.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={confirmarCambio} className="btn-primary text-sm">Confirmar y guardar</button>
            <button type="button" onClick={() => setCambioPendiente(null)} className="btn-secondary text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {/* Surface legend for cara mode */}
      {!readOnly && modoAplicacion === 'cara' && (
        <div className="bg-primary-50/50 rounded-xl p-3 border border-primary-100">
          <p className="text-[11px] text-primary-700 font-medium mb-2">Caras del diente:</p>
          <div className="flex flex-wrap gap-3 text-[10px] text-primary-600">
            <span><b>Superior:</b> Vestibular - Palatino</span>
            <span><b>Inferior:</b> Vestibular - Lingual</span>
            <span><b>Laterales:</b> Mesial - Distal</span>
            <span><b>Centro:</b> Oclusal</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center px-2">
        {Object.entries(LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-[11px] text-surface-600">
            <span className="w-3 h-3 rounded-sm shadow-sm border" style={{ backgroundColor: COLORES[key].fill, borderColor: COLORES[key].stroke }} />
            {label}
          </div>
        ))}
      </div>

      {registros.length > 0 && (
        <div className="border-t border-surface-200 pt-4">
          <button type="button" onClick={() => setMostrarHistorial(actual => !actual)} className="text-sm font-semibold text-primary-700">
            {mostrarHistorial ? 'Ocultar historial' : `Ver historial clínico (${registros.length})`}
          </button>
          {mostrarHistorial && (
            <div className="mt-3">
              <label className="mb-2 flex items-center gap-2 text-xs text-surface-600">
                Filtrar por pieza
                <select value={filtroPieza} onChange={e => setFiltroPieza(e.target.value)} className="input-field py-1 w-auto">
                  <option value="todas">Todas</option>
                  {piezasConHistorial.map(numero => <option key={numero} value={numero}>Pieza {numero}</option>)}
                </select>
              </label>
              <div className="max-h-80 overflow-auto rounded-xl border border-surface-200 divide-y divide-surface-100">
              {registrosHistorial.map(registro => (
                <div key={registro.id} className="p-3 text-xs">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-semibold text-primary-900">
                      Pieza {registro.pieza_dental} · {nombreCara(registro.cara || 'completa', registro.pieza_dental)} · {LABELS[registro.estado] || registro.estado}
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${idsVigentes.has(registro.id) ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'}`}>{idsVigentes.has(registro.id) ? 'Vigente' : 'Anterior'}</span>
                    </span>
                    <span className="text-surface-500">{new Date(registro.createdAt || registro.fecha).toLocaleString('es-MX')}</span>
                  </div>
                  <p className="mt-1 text-surface-600">Dr. {[registro.doctor?.nombre, registro.doctor?.apellido].filter(Boolean).join(' ') || 'No especificado'}</p>
                  {registro.observacion && <p className="mt-1 text-surface-700">Observación: {registro.observacion}</p>}
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
