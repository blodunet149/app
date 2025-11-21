import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@hooks/useAuth';

// Pages
import LoginPage from '../pages/Login';
import RegisterPage from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import MenuPage from '../pages/Menu';
import OrderPage from '../pages/Order';
import OrderHistoryPage from '../pages/OrderHistory';
import MenuAdminPage from '../pages/admin/MenuAdmin';
import OrdersAdminPage from '../pages/admin/OrdersAdmin';

// Components
import Header from '../components/Header';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="app">
        <AppRoutes />
      </div>
    </AuthProvider>
  );
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {(location.pathname !== '/login' && location.pathname !== '/register') && <Header />}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/menu" element={user ? <MenuPage /> : <Navigate to="/login" replace />} />
        <Route path="/order" element={user && user.role === 'user' ? <OrderPage /> : <Navigate to="/login" replace />} />
        <Route path="/order-history" element={user && user.role === 'user' ? <OrderHistoryPage /> : <Navigate to="/login" replace />} />
        <Route path="/admin/menu" element={user && user.role === 'admin' ? <MenuAdminPage /> : <Navigate to="/login" replace />} />
        <Route path="/admin/orders" element={user && user.role === 'admin' ? <OrdersAdminPage /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;