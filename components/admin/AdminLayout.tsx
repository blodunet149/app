// components/admin/AdminLayout.tsx
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../src/hooks/useAuth';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin access only.</div>;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="admin-layout">
      <nav className="admin-sidebar">
        <div className="admin-brand">
          <h3>Admin Panel</h3>
        </div>
        <ul className="admin-menu">
          <li>
            <Link 
              to="/admin/dashboard" 
              className={isActive('/admin/dashboard') ? 'active' : ''}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/reports/summary" 
              className={isActive('/admin/reports/summary') ? 'active' : ''}
            >
              Order Summary
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/reports/cooking-schedule" 
              className={isActive('/admin/reports/cooking-schedule') ? 'active' : ''}
            >
              Cooking Schedule
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/reports/daily-report" 
              className={isActive('/admin/reports/daily-report') ? 'active' : ''}
            >
              Daily Report
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/orders" 
              className={isActive('/admin/orders') ? 'active' : ''}
            >
              All Orders
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/menu" 
              className={isActive('/admin/menu') ? 'active' : ''}
            >
              Menu Management
            </Link>
          </li>
        </ul>
        <div className="admin-user-section">
          <p>Logged in as: {user.username}</p>
          <button onClick={() => logout()} className="btn btn-secondary">Logout</button>
        </div>
      </nav>
      <main className="admin-main">
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;