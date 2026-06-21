import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/inventario', label: 'Inventario' },
  { to: '/compras', label: 'Compras' },
  { to: '/ventas', label: 'Ventas' },
  { to: '/paquetes', label: 'Paquetes' },
  { to: '/terceros', label: 'Terceros' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-lg font-bold text-blue-700">SueroControl</h1>
          <p className="text-xs text-gray-400 mt-0.5">Sistema de Gestión</p>
        </div>
        <nav className="flex flex-col p-3 gap-1 flex-1">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          {user && (
            <div className="text-xs text-gray-500">
              <p className="font-medium text-gray-700 truncate">{user.nombres} {user.apellidos}</p>
              <p className="text-blue-600 font-medium">{user.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Operador'}</p>
            </div>
          )}
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {user && (
              <span>{user.nombres} {user.apellidos} · <span className="text-blue-600 font-medium">{user.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Operador'}</span></span>
            )}
          </p>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer">
            Cerrar Sesión
          </button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
