import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/', { replace: true });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) {
      setError('Complete todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(usuario, password);
      navigate('/', { replace: true });
    } catch (e: any) {
      const msg = e.message || 'Error al iniciar sesión';
      if (msg.includes('401') || msg.includes('Unauthorized')) {
        setError('Credenciales inválidas');
      } else {
        setError('Error de conexión con el servidor');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">SueroControl</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Gestión Clínica</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario o Correo</label>
            <input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              placeholder="Ingrese su usuario o correo"
              autoFocus
              autoComplete="username"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          SueroControl v3.0.0 - Sistema de Gestión Clínica
        </p>
      </div>
    </div>
  );
}
