import { useState, useEffect } from 'react';

/* ================= COLORES ================= */
const COLORES = {
  sano: { fill: '#e8f5e9', stroke: '#4caf50' },
  caries: { fill: '#ffcdd2', stroke: '#e53935' },
  obturacion: { fill: '#bbdefb', stroke: '#1e88e5' },
  corona: { fill: '#fff3e0', stroke: '#fb8c00' },
  extraccion: { fill: '#cfd8dc', stroke: '#546e7a' },
  endodoncia: { fill: '#e1bee7', stroke: '#8e24aa' },
  implante: { fill: '#b2ebf2', stroke: '#00acc1' },
  protesis: { fill: '#f8bbd0', stroke: '#d81b60' },
  ausente: { fill: '#f5f5f5', stroke: '#bdbdbd' }
};

const LABELS = {
  sano:'Sano', caries:'Caries', obturacion:'Obturación',
  corona:'Corona', extraccion:'Extracción',
  endodoncia:'Endodoncia', implante:'Implante',
  protesis:'Prótesis', ausente:'Ausente'
};

const DIENTES_SUPERIOR = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const DIENTES_INFERIOR = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

/* ================= DIENTE ================= */
function DienteGrafico({
  numero, estado, caras, estadoSeleccionado,
  onCaraClick, onDienteClick, modo, esInferior
}) {
  const [hover, setHover] = useState(null);
  const base = COLORES[estado] || COLORES.sano;

  const getColor = (cara) => {
    if (hover === cara) return COLORES[estadoSeleccionado];
    if (caras?.[cara]) return COLORES[caras[cara]];
    return base;
  };

  const cara = (name, x, y, w, h) => (
    <rect
      x={x} y={y} width={w} height={h}
      fill={getColor(name).fill}
      stroke={getColor(name).stroke}
      strokeWidth="1"
      className="transition-all duration-200 cursor-pointer hover:opacity-80"
      onMouseEnter={() => setHover(name)}
      onMouseLeave={() => setHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        if (modo === 'cara') onCaraClick(numero, name, estadoSeleccionado);
      }}
    >
      <title>{`${numero} - ${name}`}</title>
    </rect>
  );

  return (
    <div className="flex flex-col items-center mx-1">

      {/* Número arriba si es inferior */}
      {esInferior && (
        <span className="text-[10px] font-bold mb-1">{numero}</span>
      )}

      <svg
        width="40"
        height="50"
        onClick={() => modo === 'diente' && onDienteClick(numero, estadoSeleccionado)}
        className="cursor-pointer hover:scale-105 transition-all"
      >
        {cara('vestibular',10,0,20,10)}
        {cara('mesial',0,10,10,20)}
        {cara('distal',30,10,10,20)}
        {cara(esInferior ? 'lingual' : 'palatino',10,30,20,10)}
        {cara('oclusal',10,10,20,20)}
      </svg>

      {/* Número abajo si es superior */}
      {!esInferior && (
        <span className="text-[10px] font-bold mt-1">{numero}</span>
      )}
    </div>
  );
}

/* ================= ODONTOGRAMA ================= */
export default function Odontograma({
  registros = [],
  onPiezaClick,
  onGuardar
}) {

  const [modo, setModo] = useState('diente');
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('caries');
  const [carasLocal, setCarasLocal] = useState({});

  const getEstado = (pieza) =>
    registros.find(r => r.pieza_dental === pieza)?.estado || 'sano';

  const getCaras = (pieza) => ({
    ...(registros.find(r => r.pieza_dental === pieza)?.caras || {}),
    ...(carasLocal[pieza] || {})
  });

  const handleCaraClick = (num, cara, estado) => {
    setCarasLocal(prev => ({
      ...prev,
      [num]: {
        ...prev[num],
        [cara]: prev[num]?.[cara] === estado ? 'sano' : estado
      }
    }));
  };

  const handleDienteClick = (num, estado) => {
    onPiezaClick?.(num, estado);
  };

  /* ===== autosave ===== */
  useEffect(() => {
    const t = setTimeout(() => {
      if (!onGuardar) return;

      Object.entries(carasLocal).forEach(([pieza, caras]) => {
        onGuardar({
          pieza_dental: Number(pieza),
          caras
        });
      });
    }, 800);

    return () => clearTimeout(t);
  }, [carasLocal]);

  return (
    <div className="space-y-4">

      {/* CONTROLES */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={()=>setModo('diente')} className="px-3 py-1 bg-gray-100 rounded">Diente</button>
        <button onClick={()=>setModo('cara')} className="px-3 py-1 bg-gray-100 rounded">Cara</button>
      </div>

      {/* SELECTOR DE ESTADO */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(LABELS).map(([k,v]) => (
          <button key={k}
            onClick={()=>setEstadoSeleccionado(k)}
            style={{background: COLORES[k].fill}}
            className="px-2 py-1 text-xs rounded border">
            {v}
          </button>
        ))}
      </div>

      {/* ARCADA SUPERIOR */}
      <div className="text-center text-xs text-gray-400">Arcada Superior</div>
      <div className="flex justify-center">
        {DIENTES_SUPERIOR.map((n,i)=>(
          <div key={n} className="flex">
            <DienteGrafico
              numero={n}
              estado={getEstado(n)}
              caras={getCaras(n)}
              estadoSeleccionado={estadoSeleccionado}
              onCaraClick={handleCaraClick}
              onDienteClick={handleDienteClick}
              modo={modo}
            />
            {i===7 && <div className="w-4 border-l border-dashed" />}
          </div>
        ))}
      </div>

      {/* LINEA MEDIA */}
      <div className="flex items-center">
        <div className="flex-1 border-t border-dashed" />
        <span className="mx-2 text-xs">L.M</span>
        <div className="flex-1 border-t border-dashed" />
      </div>

      {/* ARCADA INFERIOR */}
      <div className="flex justify-center">
        {DIENTES_INFERIOR.map((n,i)=>(
          <div key={n} className="flex">
            <DienteGrafico
              numero={n}
              estado={getEstado(n)}
              caras={getCaras(n)}
              estadoSeleccionado={estadoSeleccionado}
              onCaraClick={handleCaraClick}
              onDienteClick={handleDienteClick}
              modo={modo}
              esInferior
            />
            {i===7 && <div className="w-4 border-l border-dashed" />}
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-gray-400">Arcada Inferior</div>

      {/* 🔥 LEYENDA / SIMBOLOGÍA */}
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        {Object.entries(LABELS).map(([k,v]) => (
          <div key={k} className="flex items-center gap-1 text-xs">
            <span
              className="w-3 h-3 rounded"
              style={{
                background: COLORES[k].fill,
                border: `1px solid ${COLORES[k].stroke}`
              }}
            />
            {v}
          </div>
        ))}
      </div>

    </div>
  );
}
