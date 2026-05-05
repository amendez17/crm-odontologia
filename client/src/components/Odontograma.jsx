import { useState, useEffect } from 'react';

const COLORES = {
  sano: '#ffffff',
  caries: '#ef4444',
  obturacion: '#3b82f6',
  corona: '#f59e0b',
  extraccion: '#374151',
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

function Diente({ num, estado, onClick }) {
  return (
    <div className="flex flex-col items-center cursor-pointer" onClick={() => onClick(num)}>
      <div
        className="w-8 h-8 border rounded transition-all duration-200 hover:scale-110"
        style={{ background: COLORES[estado] || '#fff' }}
      />
      <span className="text-[10px] mt-1">{num}</span>
    </div>
  );
}

export default function Odontograma({ registros = [], onPiezaClick }) {
  const [modo, setModo] = useState('diente');
  const [estadoSel, setEstadoSel] = useState('caries');
  const [localReg, setLocalReg] = useState([]);

  // 🔁 sync con backend
  useEffect(() => {
    setLocalReg(registros);
  }, [registros]);

  const getEstado = (pieza) => {
    const r = localReg.find(x => x.pieza_dental === pieza);
    return r ? r.estado : 'sano';
  };

  const actualizarLocal = (pieza, estado) => {
    setLocalReg(prev => {
      const existe = prev.find(p => p.pieza_dental === pieza);
      if (existe) {
        return prev.map(p =>
          p.pieza_dental === pieza ? { ...p, estado } : p
        );
      }
      return [...prev, { pieza_dental: pieza, estado }];
    });
  };

  const handleClick = (pieza) => {
    if (modo !== 'diente') return;

    // ⚡ actualización inmediata (optimista)
    actualizarLocal(pieza, estadoSel);

    // 📡 backend
    onPiezaClick?.(pieza, estadoSel);
  };

  return (
    <div className="space-y-4">

      {/* MODO */}
      <div className="flex gap-2">
        <button onClick={() => setModo('diente')} className={modo === 'diente' ? 'font-bold' : ''}>
          Diente completo
        </button>
        <button onClick={() => setModo('cara')} className={modo === 'cara' ? 'font-bold' : ''}>
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
            style={{
              background: estadoSel === k ? COLORES[k] : '#fff'
            }}
          >
            {LABELS[k]}
          </button>
        ))}
      </div>

      {/* ARCADA SUPERIOR */}
      <div className="text-center text-xs mb-2">Arcada Superior</div>
      <div className="flex justify-center gap-2">
        {DIENTES_SUP.map(n => (
          <Diente key={n} num={n} estado={getEstado(n)} onClick={handleClick} />
        ))}
      </div>

      {/* DIVISIÓN */}
      <div className="border-t my-4" />

      {/* ARCADA INFERIOR */}
      <div className="flex justify-center gap-2">
        {DIENTES_INF.map(n => (
          <Diente key={n} num={n} estado={getEstado(n)} onClick={handleClick} />
        ))}
      </div>
      <div className="text-center text-xs mt-2">Arcada Inferior</div>

      {/* LEYENDA */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {Object.entries(LABELS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 border" style={{ background: COLORES[k] }} />
            {v}
          </div>
        ))}
      </div>
    </div>
  );
}
