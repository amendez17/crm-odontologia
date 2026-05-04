import { useState } from 'react';

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

const DIENTES_SUPERIOR = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const DIENTES_INFERIOR = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

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
    e.stopPropagation();
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
      // 3 roots for molars (2 for lower)
      if (esInferior) {
        return (
          <g>
            <path d="M16,0 L19,16 Q20,18 18,18 L14,18 Q12,18 13,16 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>
            <path d="M28,0 L31,16 Q32,18 30,18 L26,18 Q24,18 25,16 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>
          </g>
        );
      }
      return (
        <g>
          <path d="M10,42 L13,58 Q14,60 12,60 L8,60 Q6,60 7,58 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>
          <path d="M22,42 L24,60 Q25,62 23,62 L19,62 Q17,62 19,60 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>
          <path d="M34,42 L37,58 Q38,60 36,60 L32,60 Q30,60 31,58 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>
        </g>
      );
    } else if (tipo === 'premolar') {
      if (esInferior) {
        return <path d="M20,0 L23,18 Q24,20 22,20 L18,20 Q16,20 17,18 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>;
      }
      return (
        <g>
          <path d="M14,38 L16,54 Q17,56 15,56 L11,56 Q9,56 10,54 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>
          <path d="M30,38 L32,54 Q33,56 31,56 L27,56 Q25,56 26,54 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>
        </g>
      );
    } else if (tipo === 'canino') {
      if (esInferior) {
        return <path d="M18,0 L21,22 Q22,24 20,24 L16,24 Q14,24 15,22 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>;
      }
      return <path d="M18,38 L21,62 Q22,64 20,64 L16,64 Q14,64 15,62 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>;
    } else {
      // Incisors
      if (esInferior) {
        return <path d="M17,0 L20,18 Q21,20 19,20 L15,20 Q13,20 14,18 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>;
      }
      return <path d="M17,38 L20,58 Q21,60 19,60 L15,60 Q13,60 14,58 Z" fill={raizColor} stroke={raizStroke} strokeWidth="0.8"/>;
    }
  };

  // Crown with 5 surfaces
  const renderCorona = () => {
    const size = tipo === 'molar' ? 44 : tipo === 'premolar' ? 40 : 36;
    const cx = size / 2 + (44 - size) / 2;
    const cy = esInferior ? 30 : 20;
    const r = size / 2 - 2;
    const ri = r * 0.45; // inner radius for oclusal

    const baseStroke = esAusente ? '#bdbdbd' : '#8d6e63';
    const baseFill = esAusente ? '#f0f0f0' : '#fef9f4';

    // Surface paths using diamond/cross pattern
    const topColor = getCaraColor('vestibular');
    const bottomColor = getCaraColor(esInferior ? 'palatino' : 'lingual');
    const leftColor = getCaraColor('mesial');
    const rightColor = getCaraColor('distal');
    const centerColor = getCaraColor('oclusal');

    return (
      <g>
        {/* Tooth crown base */}
        <rect x={cx-r} y={cy-r} width={r*2} height={r*2} rx={tipo === 'molar' ? 4 : tipo === 'incisivo' ? 2 : 3} ry={tipo === 'molar' ? 4 : tipo === 'incisivo' ? 2 : 3} fill={baseFill} stroke={baseStroke} strokeWidth="1.2"/>

        {/* Top surface (vestibular) */}
        <path
          d={`M${cx-r},${cy-r} L${cx+r},${cy-r} L${cx+ri},${cy-ri} L${cx-ri},${cy-ri} Z`}
          fill={topColor ? topColor.fill : baseFill}
          stroke={topColor ? topColor.stroke : baseStroke}
          strokeWidth={topColor ? '1.5' : '0.5'}
          className={!readOnly && !esAusente ? 'cursor-pointer hover:opacity-75' : ''}
          onClick={(e) => handleCaraClick('vestibular', e)}
        />

        {/* Bottom surface (palatino/lingual) */}
        <path
          d={`M${cx-r},${cy+r} L${cx+r},${cy+r} L${cx+ri},${cy+ri} L${cx-ri},${cy+ri} Z`}
          fill={bottomColor ? bottomColor.fill : baseFill}
          stroke={bottomColor ? bottomColor.stroke : baseStroke}
          strokeWidth={bottomColor ? '1.5' : '0.5'}
          className={!readOnly && !esAusente ? 'cursor-pointer hover:opacity-75' : ''}
          onClick={(e) => handleCaraClick(esInferior ? 'palatino' : 'lingual', e)}
        />

        {/* Left surface (mesial) */}
        <path
          d={`M${cx-r},${cy-r} L${cx-ri},${cy-ri} L${cx-ri},${cy+ri} L${cx-r},${cy+r} Z`}
          fill={leftColor ? leftColor.fill : baseFill}
          stroke={leftColor ? leftColor.stroke : baseStroke}
          strokeWidth={leftColor ? '1.5' : '0.5'}
          className={!readOnly && !esAusente ? 'cursor-pointer hover:opacity-75' : ''}
          onClick={(e) => handleCaraClick('mesial', e)}
        />

        {/* Right surface (distal) */}
        <path
          d={`M${cx+r},${cy-r} L${cx+ri},${cy-ri} L${cx+ri},${cy+ri} L${cx+r},${cy+r} Z`}
          fill={rightColor ? rightColor.fill : baseFill}
          stroke={rightColor ? rightColor.stroke : baseStroke}
          strokeWidth={rightColor ? '1.5' : '0.5'}
          className={!readOnly && !esAusente ? 'cursor-pointer hover:opacity-75' : ''}
          onClick={(e) => handleCaraClick('distal', e)}
        />

        {/* Center surface (oclusal) */}
        <rect
          x={cx-ri} y={cy-ri} width={ri*2} height={ri*2}
          rx={2} ry={2}
          fill={centerColor ? centerColor.fill : baseFill}
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

  const svgHeight = esInferior ? 58 : (tipo === 'canino' ? 68 : tipo === 'molar' ? 66 : 62);
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
        {esInferior ? (
          <>
            {renderRaiz()}
            <g transform={`translate(0, ${tipo === 'molar' ? 14 : tipo === 'premolar' ? 16 : 18})`}>
              {renderCorona()}
            </g>
          </>
        ) : (
          <>
            {renderCorona()}
            {renderRaiz()}
          </>
        )}
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
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('caries');
  const [carasPorDiente, setCarasPorDiente] = useState({});
  const [modoAplicacion, setModoAplicacion] = useState('diente'); // 'diente' | 'cara'

  const getEstadoPieza = (pieza) => {
    const reg = registros.find(r => r.pieza_dental === pieza);
    return reg ? reg.estado : 'sano';
  };

  const handleDienteClick = (numero, estado) => {
    if (readOnly) return;
    if (modoAplicacion === 'diente') {
      onPiezaClick?.(numero, estado);
    }
  };

  const handleCaraClick = (numero, cara, estado) => {
    if (readOnly || modoAplicacion !== 'cara') return;
    setCarasPorDiente(prev => {
      const diente = prev[numero] || {};
      const currentEstado = diente[cara];
      // Toggle: if same estado, go back to sano
      const nuevoEstado = currentEstado === estado ? 'sano' : estado;
      return { ...prev, [numero]: { ...diente, [cara]: nuevoEstado } };
    });
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
                onClick={() => setModoAplicacion('diente')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${modoAplicacion === 'diente' ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-500'}`}
              >
                Diente completo
              </button>
              <button
                onClick={() => setModoAplicacion('cara')}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${modoAplicacion === 'cara' ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-500'}`}
              >
                Por cara
              </button>
            </div>
          </div>

          {/* Estado selector */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(LABELS).map(([key, label]) => (
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
                {label}
              </button>
            ))}
          </div>
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
    </div>
  );
}
