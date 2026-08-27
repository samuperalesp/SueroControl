import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { fetchWarehouses } from '../api/warehouseApi';
import { useAuth } from './AuthContext';
import type { Warehouse } from '../types/warehouse';

const STORAGE_KEY = 'selectedWarehouseId';

interface WarehouseContextType {
  warehouses: Warehouse[];
  selectedWarehouseId: string | null;
  selectedWarehouse: Warehouse | null;
  loading: boolean;
  error: string | null;
  selectWarehouse: (id: string) => void;
  refresh: () => Promise<void>;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setWarehouses([]);
      setSelectedWarehouseId(null);
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchWarehouses();
        if (cancelled) return;
        const active = data.filter(w => w.activo);
        setWarehouses(active);

        const stored = localStorage.getItem(STORAGE_KEY);
        const storedValid = active.some(w => w.id === stored);
        const principal = active.find(w => w.esPrincipal);

        if (storedValid) {
          setSelectedWarehouseId(stored);
        } else if (principal) {
          setSelectedWarehouseId(principal.id);
        } else if (active.length > 0) {
          setSelectedWarehouseId(active[0].id);
        } else {
          setSelectedWarehouseId(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error al cargar almacenes');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const selectWarehouse = useCallback((id: string) => {
    setSelectedWarehouseId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchWarehouses();
      const active = data.filter(w => w.activo);
      setWarehouses(active);
      setSelectedWarehouseId(prev => {
        if (prev && active.some(w => w.id === prev)) return prev;
        const principal = active.find(w => w.esPrincipal);
        if (principal) return principal.id;
        return active[0]?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar almacenes');
    }
  }, []);

  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId) ?? null;

  return (
    <WarehouseContext.Provider
      value={{
        warehouses,
        selectedWarehouseId,
        selectedWarehouse,
        loading,
        error,
        selectWarehouse,
        refresh,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
}
