import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WarehouseProvider } from './context/WarehouseContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Inventory from './pages/Inventory';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Terceros from './pages/Terceros';
import Packages from './pages/Packages';
import Warehouses from './pages/Warehouses';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WarehouseProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/inventario" element={<ProtectedRoute><Layout><Inventory /></Layout></ProtectedRoute>} />
            <Route path="/compras" element={<ProtectedRoute><Layout><Purchases /></Layout></ProtectedRoute>} />
            <Route path="/ventas" element={<ProtectedRoute><Layout><Sales /></Layout></ProtectedRoute>} />
            <Route path="/paquetes" element={<ProtectedRoute><Layout><Packages /></Layout></ProtectedRoute>} />
            <Route path="/terceros" element={<ProtectedRoute><Layout><Terceros /></Layout></ProtectedRoute>} />
            <Route path="/almacenes" element={<ProtectedRoute><Layout><Warehouses /></Layout></ProtectedRoute>} />
          </Routes>
        </WarehouseProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
