import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.tsx';
import AreaDetail from './pages/AreaDetail.tsx';
import AreaSettings from './pages/AreaSettings.tsx';
import Layout from './components/Layout';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Protected Routes */}
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/areas/:areaId" element={<Layout><AreaDetail /></Layout>} />
        <Route path="/areas/:areaId/settings" element={<Layout><AreaSettings /></Layout>} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        {/* Default Route */}
        <Route path="*" element={<Navigate to="/dashboard" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;