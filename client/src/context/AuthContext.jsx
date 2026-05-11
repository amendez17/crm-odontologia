import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar token en ambos storages
    const token =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token');

    const userData =
      localStorage.getItem('usuario') ||
      sessionStorage.getItem('usuario');

    if (token && userData) {
      setUsuario(JSON.parse(userData));
    }

    setLoading(false);
  }, []);

  // remember = true -> localStorage
  // remember = false -> sessionStorage
  const login = (token, userData, remember = true) => {

    if (remember) {
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(userData));

      sessionStorage.removeItem('token');
      sessionStorage.removeItem('usuario');

    } else {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('usuario', JSON.stringify(userData));

      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    }

    setUsuario(userData);
  };

  const logout = () => {
    // Limpiar ambos
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');

    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
