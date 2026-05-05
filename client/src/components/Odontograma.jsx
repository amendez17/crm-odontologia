import { useState, useEffect } from 'react';

/* ================= COLORES ================= */
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
  sano:'Sano', caries:'Caries', obturacion:'Obturación', corona:'Corona',
  extraccion:'Extracción', endodoncia:'Endodoncia', implante:'Implante',
  protesis:'Prótesis', ausente:'Ausente', fractura:'Fractura'
};

const DIENTES_SUP = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const DIENTES_INF = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

/* ================= COMPONENTE ================= */
export default function Odontograma({ registros = [], onPiezaClick, readOnly = false }) {

  const [estadoSeleccionado, setEstadoSeleccionado] = useState('caries');
  const [modo, setModo] = useState('diente');

  const [odontogramaLocal, setOdontogramaLocal] = useState({});
  const [carasLocal, setCarasLocal] = useState({});

  /* ===== SYNC BACKEND ===== */
  useEffect(() => {
    const mapa = {};
    registros.forEach(r => {
      mapa[r.pieza_dental] = r.estado;
    });
    setOdontogramaLocal(mapa);
  }, [registros]);

  const getEstado = (pieza) => odontogramaLocal[pieza] || 'sano';

  /* ===== CLICK DIENTE ===== */
  const handleDiente = (pieza) => {
    if (readOnly || modo !== 'diente') return;

    setOdontogramaLocal(prev => ({
      ...prev,
      [pieza]: estadoSeleccionado
    }));

    onPiezaClick?.(pieza, estadoSeleccionado);
  };

  /* ===== CLICK CARA ===== */
  const handleCara = (pieza, cara) => {
    if (readOnly || modo !== 'cara') return;

    setCarasLocal(prev => {
      const diente = prev[pieza] || {};
      const actual = diente[cara];

      return {
        ...prev,
        [pieza]: {
          ...diente,
          [cara]: actual === estadoSeleccionado ? 'sano' : estadoSeleccionado
        }
      };
    });
  };

  /* ===== DIENTE SVG PRO ===== */
  const Diente = ({ num }) => {
    const estado = getEstado(num);
    const color = COLORES[estado];
    const caras = carasLocal[num] || {};

    const getCara = (c) => {
      const e = caras[c];
      return e && e !== 'sano' ? COLORES[e] : null;
    };

    return (
      <div className="flex flex-col items-center group">
        <svg
          width="42"
          height="60"
          className="cursor-pointer transition-all duration-200 hover:scale-110"
          onClick={() => handleDiente(num)}
        >
          {/* BASE */}
          <rect
            x="5"
            y="5"
            width="32"
            height="40"
            rx="6"
            fill={color.fill}
            stroke={color.stroke}
            strokeWidth="2"
            style={{ transition: 'all .2s ease' }}
          />

          {/* CARAS */}
          {[
            { key:'vestibular', pos:[10,5,22,10] },
            { key:'palatino', pos:[10,35,22,10] },
            { key:'mesial', pos:[5,15,10,20] },
            { key:'distal', pos:[27,15,10,20] },
            { key:'oclusal', pos:[15,18,12,12] }
          ].map(({key,pos})=>{
            const col = getCara(key);
            if(!col) return null;

            return (
              <rect
                key={key}
                x={pos[0]}
                y={pos[1]}
                width={pos[2]}
                height={pos[3]}
                fill={col.fill}
                stroke={col.stroke}
                strokeWidth="1.5"
                className="cursor-pointer transition-all hover:opacity-80"
                onClick={(e)=>{
                  e.stopPropagation();
                  handleCara(num, key);
                }}
              />
            );
          })}
        </svg>

        <span className="text-[10px] mt-1">{num}</span>
      </div>
    );
  };

  /* ================= UI ================= */
  return (
    <div className="space-y-4">

      {!readOnly && (
        <>
          {/* MODO */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold">Modo:</span>

            <button
              onClick={()=>setModo('diente')}
              className={`px-3 py-1 rounded ${modo==='diente'?'bg-blue-500 text-white':'bg-gray-200'}`}
            >
              Diente
            </button>

            <button
              onClick={()=>setModo('cara')}
              className={`px-3 py-1 rounded ${modo==='cara'?'bg-blue-500 text-white':'bg-gray-200'}`}
            >
              Cara
            </button>
          </div>

          {/* ESTADOS */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(LABELS).map(([k,v])=>(
              <button
                key={k}
                onClick={()=>setEstadoSeleccionado(k)}
                className={`px-3 py-1 rounded border ${
                  estadoSeleccionado===k?'ring-2 ring-black':''
                }`}
                style={{ backgroundColor: COLORES[k].fill }}
              >
                {v}
              </button>
            ))}
          </div>
        </>
      )}

      {/* SUPERIOR */}
      <div className="flex justify-center gap-1">
        {DIENTES_SUP.map(n => <Diente key={n} num={n} />)}
      </div>

      {/* INFERIOR */}
      <div className="flex justify-center gap-1">
        {DIENTES_INF.map(n => <Diente key={n} num={n} />)}
      </div>

      {/* LEYENDA */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {Object.entries(LABELS).map(([k,v])=>(
          <div key={k} className="flex items-center gap-2 text-xs">
            <span
              className="w-4 h-4 rounded border"
              style={{
                backgroundColor: COLORES[k].fill,
                borderColor: COLORES[k].stroke
              }}
            />
            {v}
          </div>
        ))}
      </div>

    </div>
  );
}
