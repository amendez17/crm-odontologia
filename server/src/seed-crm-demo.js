require('dotenv').config();

const {
  sequelize, Usuario, Paciente, Cita, Presupuesto, Pago
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

    console.log('\nDatos CRM de demostración creados correctamente.');
    console.log('10 pacientes ficticios, visitas, citas futuras, pagos y oportunidades.');
    console.log('Puedes ejecutar este comando nuevamente sin duplicar los registros.');
    process.exit(0);
  } catch (error) {
    console.error('Error al crear datos CRM de demostración:', error);
    process.exit(1);
  }
}

ejecutar();
