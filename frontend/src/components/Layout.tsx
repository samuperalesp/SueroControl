import { useState, type ComponentType, type SVGProps } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWarehouse } from '../context/WarehouseContext';
import {
  CloseIcon,
  DashboardIcon,
  FlaskIcon,
  InventoryIcon,
  LogoutIcon,
  MenuIcon,
  MoonIcon,
  PackagesIcon,
  PurchasesIcon,
  ReportsIcon,
  SalesIcon,
  SunIcon,
  TercerosIcon,
  WarehouseSelectIcon,
  WarehousesIcon,
} from './Icons';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const links: { to: string; label: string; icon: IconComponent }[] = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon },
  { to: '/inventario', label: 'Inventario', icon: InventoryIcon },
  { to: '/compras', label: 'Compras', icon: PurchasesIcon },
  { to: '/ventas', label: 'Ventas', icon: SalesIcon },
  { to: '/paquetes', label: 'Paquetes', icon: PackagesIcon },
  { to: '/terceros', label: 'Terceros', icon: TercerosIcon },
  { to: '/almacenes', label: 'Almacenes', icon: WarehousesIcon },
  { to: '/reportes', label: 'Reportes', icon: ReportsIcon },
];

const pageMeta: Record<string, { title: string; description: string }> = {
  '/': { title: 'Panel de control', description: 'Resumen general de la operación' },
  '/inventario': { title: 'Inventario', description: 'Productos, stock y traslados' },
  '/compras': { title: 'Compras', description: 'Facturas de compra y pedidos' },
  '/ventas': { title: 'Ventas', description: 'Facturación y paquetes por sesiones' },
  '/paquetes': { title: 'Paquetes', description: 'Configuración y rentabilidad' },
  '/terceros': { title: 'Terceros', description: 'Clientes, proveedores y médicos' },
  '/almacenes': { title: 'Almacenes', description: 'Gestión de puntos de inventario' },
  '/reportes': { title: 'Reportes', description: 'Ganancias y análisis por profesional' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { warehouses, selectedWarehouseId, selectWarehouse } = useWarehouse();
  const navigate = useNavigate();
  const location = useLocation();

  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const expanded = hovered || mobileOpen;
  const meta = pageMeta[location.pathname] ?? {
    title: 'SueroControl',
    description: 'Sistema de gestión clínica',
  };
  const initials = user
    ? `${user.nombres?.[0] ?? ''}${user.apellidos?.[0] ?? ''}`.toUpperCase() || 'SC'
    : 'SC';
  const roleLabel = user?.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Operador';

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-slate-100 transition-[width,transform,box-shadow] duration-300 ease-out dark:border-slate-800 dark:bg-slate-900 ${
          expanded
            ? 'w-[17.5rem] shadow-[var(--shadow-sidebar)]'
            : 'w-[4.5rem] shadow-none'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Marca */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-slate-200/80 dark:border-slate-800 ${
            expanded ? 'gap-3 px-4' : 'justify-center px-0'
          }`}
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <FlaskIcon className="h-5 w-5" />
          </div>
          <div
            className={`min-w-0 overflow-hidden transition-all duration-200 ${
              expanded ? 'max-w-[11rem] opacity-100' : 'max-w-0 opacity-0'
            }`}
          >
            <p className="whitespace-nowrap text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
              SueroControl
            </p>
            <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Gestión clínica
            </p>
          </div>
          {mobileOpen && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
              className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100 lg:hidden"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navegación */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          <p
            className={`mb-1 h-5 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 transition-opacity duration-200 dark:text-slate-500 ${
              expanded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Módulos
          </p>
          {links.map(link => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                title={expanded ? undefined : link.label}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group relative flex h-11 items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                    expanded ? 'gap-3 px-3' : 'justify-center px-0'
                  } ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-white dark:ring-slate-700/70'
                      : 'text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-600 transition-opacity duration-200 dark:bg-blue-400 ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center transition-transform duration-200 ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-300'
                          : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'
                      } ${expanded ? '' : 'group-hover:scale-110'}`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span
                      className={`whitespace-nowrap text-[13.5px] transition-all duration-200 ${
                        expanded
                          ? 'max-w-[10rem] opacity-100'
                          : 'pointer-events-none max-w-0 -translate-x-1 overflow-hidden opacity-0'
                      }`}
                    >
                      {link.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Usuario */}
        <div className="shrink-0 border-t border-slate-200/80 p-3 dark:border-slate-800">
          <div
            className={`flex items-center rounded-xl bg-white/80 shadow-sm ring-1 ring-slate-200/70 transition-all duration-200 dark:bg-slate-800/70 dark:ring-slate-700/60 ${
              expanded ? 'gap-3 p-2.5' : 'justify-center p-2'
            }`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-semibold text-white ring-2 ring-white dark:from-slate-200 dark:to-slate-400 dark:text-slate-900 dark:ring-slate-900">
              {initials}
            </span>
            <div
              className={`min-w-0 transition-all duration-200 ${
                expanded ? 'max-w-[10rem] opacity-100' : 'max-w-0 overflow-hidden opacity-0'
              }`}
            >
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                {user ? `${user.nombres} ${user.apellidos}` : 'Usuario'}
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {roleLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title={expanded ? undefined : 'Cerrar sesión'}
            className={`mt-2 flex h-10 w-full items-center rounded-xl text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 ${
              expanded ? 'gap-3 px-3' : 'justify-center px-0'
            }`}
          >
            <LogoutIcon className="h-[18px] w-[18px] shrink-0" />
            <span
              className={`whitespace-nowrap text-[13px] font-medium transition-all duration-200 ${
                expanded
                  ? 'max-w-[10rem] opacity-100'
                  : 'pointer-events-none max-w-0 overflow-hidden opacity-0'
              }`}
            >
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      {/* Contenedor principal */}
      <div className="flex min-h-screen w-full flex-col lg:pl-[4.5rem]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 lg:hidden"
              >
                <MenuIcon className="h-[18px] w-[18px]" />
              </button>

              <div className="min-w-0">
                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 sm:block">
                  SueroControl
                </p>
                <div className="flex items-baseline gap-2">
                  <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-white sm:text-[15px]">
                    {meta.title}
                  </h1>
                  <span className="hidden truncate text-xs text-slate-400 dark:text-slate-500 md:inline">
                    · {meta.description}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {warehouses.length > 0 && (
                <label
                  className="group relative flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 text-slate-500 transition-colors focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/30 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:focus-within:border-blue-500 dark:hover:border-slate-700 sm:gap-2 sm:px-2.5"
                  title="Almacén activo"
                >
                  <WarehouseSelectIcon className="hidden h-4 w-4 shrink-0 sm:block" />
                  <select
                    value={selectedWarehouseId ?? ''}
                    onChange={e => selectWarehouse(e.target.value)}
                    className="max-w-[5.5rem] cursor-pointer appearance-none truncate bg-transparent py-0 pr-4 text-xs font-medium text-slate-700 outline-none dark:text-slate-200 sm:max-w-[12rem]"
                    aria-label="Seleccionar almacén"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.nombre}
                      </option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute right-2 h-3 w-3 opacity-60"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </label>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                title={isDark ? 'Modo claro' : 'Modo oscuro'}
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                {isDark ? (
                  <SunIcon className="h-[18px] w-[18px]" />
                ) : (
                  <MoonIcon className="h-[18px] w-[18px]" />
                )}
              </button>

              <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-800 md:block" />

              {user && (
                <div className="hidden items-center gap-2.5 md:flex">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-[11px] font-semibold text-white ring-2 ring-white dark:from-slate-200 dark:to-slate-400 dark:text-slate-900 dark:ring-slate-900">
                    {initials}
                  </span>
                  <div className="leading-tight">
                    <p className="max-w-[11rem] truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {user.nombres} {user.apellidos}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {roleLabel}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 md:hidden"
              >
                <LogoutIcon className="h-[18px] w-[18px]" />
              </button>

              {mobileOpen && (
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Cerrar menú"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300 lg:hidden"
                >
                  <CloseIcon className="h-[18px] w-[18px]" />
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="sc-fade-in mx-auto w-full max-w-[90rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}
