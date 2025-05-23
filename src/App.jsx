import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import GranteeDashboard from './pages/dashboards/GranteeDashboard';
import GrantorDashboard from './pages/dashboards/GrantorDashboard';
import AuditorDashboard from './pages/dashboards/AuditorDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/ProtectedRoute';
import SessionTimeoutWarning from './SessionTimeoutWarning';

function App() {
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('gfgpStructure');
    window.location.href = '/';
  };

  const isLoggedIn = !!localStorage.getItem('user'); // check if user is logged in

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} />
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* role-based routes */}
        <Route path="/grantee/*" element={
          <ProtectedRoute allowedRoles={['GRANTEE']}>
            <GranteeDashboard />
          </ProtectedRoute>
        } />
        <Route path="/grantor/*" element={
          <ProtectedRoute allowedRoles={['GRANTOR']}>
            <GrantorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/auditor/*" element={
          <ProtectedRoute allowedRoles={['AUDITOR']}>
            <AuditorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {isLoggedIn && <SessionTimeoutWarning onLogout={handleLogout} />}
    </Router>
  );
}

export default App;