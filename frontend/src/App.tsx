import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Inventory from './pages/Inventory';

function Dashboard() {
  return (
    <div className="text-center mt-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Panel de Control</h2>
      <p className="text-gray-400">Seleccione un módulo en el menú lateral.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventario" element={<Inventory />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
