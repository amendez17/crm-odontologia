import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import PacienteDetalle from './pages/PacienteDetalle';
import Citas from './pages/Citas';
import Tratamientos from './pages/Tratamientos';
import Presupuestos from './pages/Presupuestos';
import Pagos from './pages/Pagos';
import Usuarios from './pages/Usuarios';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import Actividad from './pages/Actividad';
import Mantenimiento from './pages/Mantenimiento';
import Facturas from './pages/Facturas';

/*function PrivateRoute({ children }) {
  const { usuario, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  return usuario ? children : <Navigate to="/login" />;
}
*/
function PrivateRoute({ children, roles }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Cargando...
      </div>
    );
  }

  // 🔒 no logueado
  if (!usuario) {
    return <Navigate to="/login" />;
  }

  // 🔒 sin permisos
  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" />;
  }

  return children;
}
export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute roles={["administrador", "doctor", "recepcionista"]}><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/citas" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pacientes" element={ <PrivateRoute roles={["administrador", "doctor", "recepcionista"]}> <Pacientes /> </PrivateRoute> }/>
          <Route path="pacientes/:id" element={ <PrivateRoute roles={["administrador", "doctor", "recepcionista"]}> <PacienteDetalle /> </PrivateRoute>}/>
          <Route path="citas" element={  <PrivateRoute roles={["administrador", "doctor", "recepcionista"]}>    <Citas />  </PrivateRoute> }/>  
          <Route path="tratamientos" element={ <PrivateRoute roles={["administrador", "doctor"]}> <Tratamientos /> </PrivateRoute>}/>
          <Route path="presupuestos" element={ <PrivateRoute roles={["administrador", "doctor"]}> <Presupuestos /> </PrivateRoute> }/>
          <Route path="pagos" element={ <PrivateRoute roles={["administrador", "doctor", "recepcionista"]}> <Pagos /></PrivateRoute>}/>
          <Route path="facturas" element={ <PrivateRoute roles={["administrador", "recepcionista"]}> <Facturas /></PrivateRoute>}/>
          <Route path="usuarios" element={ <PrivateRoute roles={["administrador"]}> <Usuarios />  </PrivateRoute> }/>
          <Route path="reportes" element={ <PrivateRoute roles={["administrador"]}> <Reportes /> </PrivateRoute> }/>
          <Route path="actividad" element={ <PrivateRoute roles={["administrador"]}> <Actividad /> </PrivateRoute>}/>
          <Route path="mantenimiento" element={ <PrivateRoute roles={["administrador"]}> <Mantenimiento /> </PrivateRoute> }/>
          <Route path="configuracion" element={<PrivateRoute roles={["administrador"]}><Configuracion />   </PrivateRoute>}/>
        </Route>
      </Routes>
    </>
  );
}
