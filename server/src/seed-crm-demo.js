require('dotenv').config();

const {
  sequelize, Usuario, Paciente, Cita, Presupuesto, Pago, CrmEtapa, CrmOportunidad, CrmTarea, CrmPerfil
} = require('./models');

const fecha = dias => {
  const valor = new Date();
  valor.setHours(12, 0, 0, 0);
  valor.setDate(valor.getDate() + dias);
  return valor.toISOString().slice(0, 10);
};

const pacientesDemo = [
  { dni: 'DEMO-CRM-001', nombre: 'Lucía', apellido: 'Fernández', telefono: '6691000001', email: 'lucia.demo@example.com', fecha_nacimiento: '1991-11-03' },
  { dni: 'DEMO-CRM-002', nombre: 'Pedro', apellido: 'Gutiérrez', telefono: '6691000002', email: 'pedro.demo@example.com', fecha_nacimiento: '1988-03-21' },
  { dni: 'DEMO-CRM-003', nombre: 'Ana', apellido: 'Castillo', telefono: '6691000003', email: 'ana.demo@example.com', fecha_nacimiento: '1994-11-09' },
  { dni: 'DEMO-CRM-004', nombre: 'Mariana', apellido: 'López', telefono: '6691000004', email: 'mariana.demo@example.com', fecha_nacimiento: '1985-07-14' },
  { dni: 'DEMO-CRM-005', nombre: 'Roberto', apellido: 'Sánchez', telefono: '6691000005', email: 'roberto.demo@example.com', fecha_nacimiento: '1979-01-30' },
  { dni: 'DEMO-CRM-006', nombre: 'Carolina', apellido: 'Vega', telefono: '6691000006', email: 'carolina.demo@example.com', fecha_nacimiento: '1997-06-18' },
  { dni: 'DEMO-CRM-007', nombre: 'Miguel', apellido: 'Ramírez', telefono: '6691000007', email: 'miguel.demo@example.com', fecha_nacimiento: '1990-09-02' },
  { dni: 'DEMO-CRM-008', nombre: 'Sofía', apellido: 'Moreno', telefono: '6691000008', email: 'sofia.demo@example.com', fecha_nacimiento: '2001-12-12' },
  { dni: 'DEMO-CRM-009', nombre: 'Daniel', apellido: 'Ortega', telefono: '6691000009', email: 'daniel.demo@example.com', fecha_nacimiento: '1983-05-24' },
  { dni: 'DEMO-CRM-010', nombre: 'Valeria', apellido: 'Núñez', telefono: '6691000010', email: 'valeria.demo@example.com', fecha_nacimiento: '1998-02-17' }
];

const visitasPorPaciente = {
  'DEMO-CRM-001': [-18, -70, -135],
  'DEMO-CRM-002': [-35, -92, -180],
  'DEMO-CRM-003': [-22, -80, -155, -230],
  'DEMO-CRM-004': [-48, -105],
  'DEMO-CRM-005': [-165],
  'DEMO-CRM-006': [-205],
  'DEMO-CRM-007': [-42],
  'DEMO-CRM-008': [-12]
};

const citasFuturas = [
  { dni: 'DEMO-CRM-001', dias: 2, hora: '09:00:00', motivo: 'Limpieza preventiva' },
  { dni: 'DEMO-CRM-004', dias: 4, hora: '11:30:00', motivo: 'Valoración general' },
  { dni: 'DEMO-CRM-007', dias: 7, hora: '16:00:00', motivo: 'Control de tratamiento' },
  { dni: 'DEMO-CRM-009', dias: 9, hora: '10:00:00', motivo: 'Primera consulta' }
];

const montos = {
  'DEMO-CRM-001': [1200, 800, 500],
  'DEMO-CRM-002': [2500, 900],
  'DEMO-CRM-003': [5000, 1500, 700],
  'DEMO-CRM-004': [1800, 600],
  'DEMO-CRM-005': [950],
  'DEMO-CRM-006': [1300],
  'DEMO-CRM-007': [700],
  'DEMO-CRM-008': [500]
};

async function ejecutar() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const doctores = await Usuario.findAll({ where: { rol: 'doctor', activo: true }, order: [['id', 'ASC']] });
    if (!doctores.length) throw new Error('Primero ejecuta npm run seed para crear los doctores de demostración.');

    const pacientes = new Map();
    for (const datos of pacientesDemo) {
      const [paciente] = await Paciente.findOrCreate({
        where: { dni: datos.dni },
        defaults: { ...datos, genero: 'otro', direccion: 'Registro ficticio para pruebas CRM', activo: true }
      });
      pacientes.set(datos.dni, paciente);
      const [perfil] = await CrmPerfil.findOrCreate({ where: { paciente_id: paciente.id }, defaults: { paciente_id: paciente.id } });
      await perfil.update({
        acepta_marketing: !['DEMO-CRM-009', 'DEMO-CRM-010'].includes(datos.dni),
        origen: Number(datos.dni.slice(-1)) % 2 ? 'Recomendación' : 'Redes sociales',
        responsable_id: doctores[Number(datos.dni.slice(-1)) % doctores.length].id
      });
    }

    let indiceDoctor = 0;
    for (const [dni, diasVisitas] of Object.entries(visitasPorPaciente)) {
      const paciente = pacientes.get(dni);
      for (let i = 0; i < diasVisitas.length; i += 1) {
        const doctor = doctores[indiceDoctor % doctores.length];
        indiceDoctor += 1;
        await Cita.findOrCreate({
          where: { paciente_id: paciente.id, fecha: fecha(diasVisitas[i]), hora_inicio: '10:00:00' },
          defaults: {
            doctor_id: doctor.id,
            hora_fin: '10:45:00',
            motivo: i === 0 ? 'Consulta y seguimiento dental' : 'Control preventivo',
            estado: 'completada',
            notas: 'Dato ficticio generado para probar el Panel CRM.'
          }
        });
      }
    }

    for (const datos of citasFuturas) {
      const paciente = pacientes.get(datos.dni);
      const doctor = doctores[indiceDoctor % doctores.length];
      indiceDoctor += 1;
      await Cita.findOrCreate({
        where: { paciente_id: paciente.id, fecha: fecha(datos.dias), hora_inicio: datos.hora },
        defaults: {
          doctor_id: doctor.id,
          hora_fin: datos.hora,
          motivo: datos.motivo,
          estado: 'programada',
          notas: 'Dato ficticio generado para probar el Panel CRM.'
        }
      });
    }

    for (const [dni, pagos] of Object.entries(montos)) {
      const paciente = pacientes.get(dni);
      for (let i = 0; i < pagos.length; i += 1) {
        await Pago.findOrCreate({
          where: { numero_recibo: `DEMO-${dni.slice(-3)}-${i + 1}` },
          defaults: {
            paciente_id: paciente.id,
            monto: pagos[i],
            metodo_pago: i % 2 === 0 ? 'efectivo' : 'transferencia',
            fecha: fecha(-(i * 45 + 10)),
            notas: 'Pago ficticio para pruebas CRM.'
          }
        });
      }
    }

    const oportunidades = [
      { dni: 'DEMO-CRM-001', total: 3500, estado: 'aceptado' },
      { dni: 'DEMO-CRM-004', total: 5200, estado: 'pendiente' },
      { dni: 'DEMO-CRM-007', total: 2800, estado: 'en_curso' },
      { dni: 'DEMO-CRM-009', total: 1500, estado: 'pendiente' }
    ];

    for (let i = 0; i < oportunidades.length; i += 1) {
      const oportunidad = oportunidades[i];
      const paciente = pacientes.get(oportunidad.dni);
      const doctor = doctores[i % doctores.length];
      await Presupuesto.findOrCreate({
        where: { paciente_id: paciente.id, notas: `DEMO CRM ${i + 1}` },
        defaults: {
          doctor_id: doctor.id,
          estado: oportunidad.estado,
          total: oportunidad.total,
          descuento: 0
        }
      });
    }

    const etapasBase = [
      { clave: 'interesado', nombre: 'Interesado', color: '#64748b', probabilidad: 10, tipo: 'ABIERTA', orden: 1 },
      { clave: 'contactado', nombre: 'Contactado', color: '#0ea5e9', probabilidad: 25, tipo: 'ABIERTA', orden: 2 },
      { clave: 'presupuesto', nombre: 'Presupuesto', color: '#8b5cf6', probabilidad: 50, tipo: 'ABIERTA', orden: 3 },
      { clave: 'seguimiento', nombre: 'Seguimiento', color: '#f59e0b', probabilidad: 70, tipo: 'ABIERTA', orden: 4 },
      { clave: 'ganado', nombre: 'Aceptado', color: '#10b981', probabilidad: 100, tipo: 'GANADA', orden: 5 },
      { clave: 'perdido', nombre: 'No concretado', color: '#ef4444', probabilidad: 0, tipo: 'PERDIDA', orden: 6 }
    ];
    const etapas = new Map();
    for (const datos of etapasBase) {
      const [etapa] = await CrmEtapa.findOrCreate({ where: { clave: datos.clave }, defaults: datos });
      etapas.set(datos.clave, etapa);
    }

    const oportunidadesCrm = [
      { dni: 'DEMO-CRM-009', etapa: 'interesado', titulo: 'Primera valoración', tratamiento: 'Consulta y diagnóstico', valor: 500, dias: 9 },
      { dni: 'DEMO-CRM-006', etapa: 'contactado', titulo: 'Reactivar limpieza preventiva', tratamiento: 'Limpieza dental', valor: 500, dias: 5 },
      { dni: 'DEMO-CRM-004', etapa: 'presupuesto', titulo: 'Tratamiento restaurador', tratamiento: 'Resinas estéticas', valor: 1800, dias: 14 },
      { dni: 'DEMO-CRM-007', etapa: 'seguimiento', titulo: 'Inicio de ortodoncia', tratamiento: 'Ortodoncia', valor: 3000, dias: 20 },
      { dni: 'DEMO-CRM-003', etapa: 'ganado', titulo: 'Blanqueamiento aceptado', tratamiento: 'Blanqueamiento dental', valor: 1000, dias: -2 }
    ];
    for (let i = 0; i < oportunidadesCrm.length; i += 1) {
      const datos = oportunidadesCrm[i];
      const paciente = pacientes.get(datos.dni);
      const etapa = etapas.get(datos.etapa);
      await CrmOportunidad.findOrCreate({
        where: { paciente_id: paciente.id, titulo: datos.titulo },
        defaults: {
          etapa_id: etapa.id,
          responsable_id: doctores[i % doctores.length].id,
          creado_por_id: doctores[i % doctores.length].id,
          tratamiento_interes: datos.tratamiento,
          valor: datos.valor,
          origen: i % 2 ? 'WhatsApp' : 'Facebook',
          cierre_estimado: fecha(datos.dias),
          estado: etapa.tipo,
          orden: 1,
          cerrado_en: etapa.tipo === 'ABIERTA' ? null : new Date(),
          notas: 'Oportunidad ficticia para probar el pipeline CRM.'
        }
      });
    }

    const tareasDemo = [
      { dni: 'DEMO-CRM-006', titulo: 'Enviar recordatorio de limpieza', tipo: 'WHATSAPP', prioridad: 'ALTA', dias: 1 },
      { dni: 'DEMO-CRM-004', titulo: 'Dar seguimiento al presupuesto', tipo: 'LLAMADA', prioridad: 'MEDIA', dias: 2 },
      { dni: 'DEMO-CRM-007', titulo: 'Confirmar decisión sobre ortodoncia', tipo: 'SEGUIMIENTO', prioridad: 'ALTA', dias: 3 },
      { dni: 'DEMO-CRM-001', titulo: 'Confirmar próxima cita', tipo: 'WHATSAPP', prioridad: 'MEDIA', dias: 1 }
    ];
    for (let i = 0; i < tareasDemo.length; i += 1) {
      const datos = tareasDemo[i];
      const paciente = pacientes.get(datos.dni);
      await CrmTarea.findOrCreate({
        where: { paciente_id: paciente.id, titulo: datos.titulo },
        defaults: {
          asignado_id: doctores[i % doctores.length].id,
          creado_por_id: doctores[i % doctores.length].id,
          tipo: datos.tipo,
          prioridad: datos.prioridad,
          vence: `${fecha(datos.dias)} 10:00:00`,
          estado: 'PENDIENTE',
          notas: 'Tarea ficticia para probar el seguimiento CRM.'
        }
      });
    }

    console.log('\nDatos CRM de demostración creados correctamente.');
    console.log('10 pacientes ficticios, visitas, citas futuras, pagos, pipeline y tareas.');
    console.log('Puedes ejecutar este comando nuevamente sin duplicar los registros.');
    process.exit(0);
  } catch (error) {
    console.error('Error al crear datos CRM de demostración:', error);
    process.exit(1);
  }
}

ejecutar();
