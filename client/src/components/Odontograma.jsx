import { useState, useEffect } from 'react';

/* ================= COLORES ================= */
const COLORES = {
  sano: { fill: '#ffffff', stroke: '#4caf50' },
  caries: { fill: '#ffcdd2', stroke: '#e53935' },
  obturacion: { fill: '#bbdefb', stroke: '#1e88e5' },
  corona: { fill: '#fff3e0', stroke: '#fb8c00' },
  extraccion: { fill: '#eeeeee', stroke: '#616161' },
};

const LABELS = {
  sano: 'Sano',
  caries: 'Caries',
  obturacion: 'Obturación',
  corona: 'Corona',
  extraccion: 'Extracción',
};

const DIENTES_SUP = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const DIENTES_INF = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

/* ================= DIENTE SVG ================= */
function Diente({ num, estado, caras, modo, estadoSel, onClickDiente, onClickCara }) {

  const handleClick = () => {
    if (modo === 'diente') onClickDiente(num);
  };

  const handleCara = (cara, e) => {
    e.stopPropagation();
    if (modo === 'cara') onClickCara(num, cara);
  };

  return (
    <div className="flex flex-col items-center cursor-pointer">
      <svg width="40" height="50" onClick={handleClick} className="transition hover:scale-110">

        {/* BASE */}
        <rect
          x="5" y="5" width="30" height="30"
          fill={COLORES[estado]?.fill}
          stroke={COLORES[estado]?.stroke}
        />

        {/* CARAS */}
        {['mesial','distal','vestibular','lingual','oclusal'].map((cara, i) => (
          <rect
            key={cara}
            x={10 + (i % 2) * 10}
            y={10 + Math.floor(i / 2) * 10}
            width="8"
            height="8"
            fill={caras?.[cara] ? COLORES[caras[cara]].fill : 'transparent'}
            stroke="#999"
            onClick={(e) => handleCara(cara, e)}
          />
        ))}

      </svg>

      {/* NUMERO */}
      <span className="text-[10px] mt-1">{num}</span>
    </div>
  );
}

/* ================= COMPONENTE ================= */
export default function Odontograma({ registros = [], onPiezaClick }) {

  const [modo, setModo] = useState('diente');
  const [estadoSel, setEstadoSel] = useState('caries');

  const [localRegistros, setLocalRegistros] = useState([]);
  const [carasPorDiente, setCarasPorDiente] = useState({});

  /* 🔁 sync backend */
  useEffect(() => {
    setLocalRegistros(registros);
  }, [registros]);

  /* 🔎 estado pieza */
  const getEstado = (pieza) => {
    const local = localRegistros.find(p => p.pieza_dental === pieza);
    return local?.estado || 'sano';
  };

  /* ⚡ update optimista */
  const updateLocal = (pieza, estado) => {
    setLocalRegistros(prev => {
      const existe = prev.find(p => p.pieza_dental === pieza);
      if (existe) {
        return prev.map(p => p.pieza_dental === pieza ? { ...p, estado } : p);
      }
      return [...prev, { pieza_dental: pieza, estado }];
    });
  };

  /* 🦷 CLICK DIENTE */
  const handleDiente = (pieza) => {
    updateLocal(pieza, estadoSel);
    onPiezaClick?.(pieza, estadoSel);
  };

  /* 🦷 CLICK CARA */
  const handleCara = (pieza, cara) => {
    setCarasPorDiente(prev => {
      const diente = prev[pieza] || {};
      const nuevo = diente[cara] === estadoSel ? 'sano' : estadoSel;

      return {
        ...prev,
        [pieza]: { ...diente, [cara]: nuevo }
      };
    });

    onPiezaClick?.(pieza, estadoSel, cara);
  };

  return (
    <div className="space-y-4">

      {/* MODO */}
      <div className="flex gap-2">
        <button onClick={() => setModo('diente')} className={modo==='diente' ? 'font-bold' : ''}>
          Diente completo
        </button>
        <button onClick={() => setModo('cara')} className={modo==='cara' ? 'font-bold' : ''}>
          Por cara
        </button>
      </div>

      {/* ESTADOS */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(LABELS).map(k => (
          <button
            key={k}
            onClick={() => setEstadoSel(k)}
            className="px-2 py-1 border rounded text-xs"
            style={{ background: estadoSel === k ? COLORES[k].fill : '#fff' }}
          >
            {LABELS[k]}
          </button>
        ))}
      </div>

      {/* SUPERIOR */}
      <div className="text-center text-xs">Arcada Superior</div>
      <div className="flex justify-center gap-2">
        {DIENTES_SUP.map(n => (
          <Diente
            key={n}
            num={n}
            estado={getEstado(n)}
            caras={carasPorDiente[n]}
            modo={modo}
            estadoSel={estadoSel}
            onClickDiente={handleDiente}
            onClickCara={handleCara}
          />
        ))}
      </div>

      {/* LINEA MEDIA */}
      <div className="flex items-center my-2">
        <div className="flex-1 border-t border-dashed"/>
        <span className="mx-2 text-xs">L.M</span>
        <div className="flex-1 border-t border-dashed"/>
      </div>

      {/* INFERIOR */}
      <div className="flex justify-center gap-2">
        {DIENTES_INF.map(n => (
          <Diente
            key={n}
            num={n}
            estado={getEstado(n)}
            caras={carasPorDiente[n]}
            modo={modo}
            estadoSel={estadoSel}
            onClickDiente={handleDiente}
            onClickCara={handleCara}
          />
        ))}
      </div>
      <div className="text-center text-xs">Arcada Inferior</div>

      {/* LEYENDA */}
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        {Object.entries(LABELS).map(([k,v]) => (
          <div key={k} className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 border" style={{ background: COLORES[k].fill }}/>
            {v}
          </div>
        ))}
      </div>

    </div>
  );
}
