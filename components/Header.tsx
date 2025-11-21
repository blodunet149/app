import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container">
        <h1>
          <Link to="/" className="logo">Catering App</Link>
        </h1>
        <nav className="nav">
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/menu">Menu</Link>
              {user.role === 'user' && (
                <>
                  <Link to="/order">Order</Link>
                  <Link to="/order-history">Order History</Link>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <Link to="/admin/menu">Manage Menu</Link>
                  <Link to="/admin/orders">Manage Orders</Link>
                </>
              )}
              <button onClick={handleLogout} className="logout-btn">Logout ({user.username})</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;