import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🔐 Ruta correcta del backend
      const { data } = await api.post('/api/auth/login', {
        email,
        password
      });

      // guardar sesión
      login(data.token, data.usuario);

      toast.success('Bienvenido 👋');
      navigate('/');

    } catch (err) {
      console.log('ERROR LOGIN:', err.response?.data || err.message);

      toast.error(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al iniciar sesión'
      );

    } finally {
      setLoading(false);
    }
  };


}
