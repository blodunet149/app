import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in to view the dashboard</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Welcome, {user.username}! You are logged in as {user.role}.</p>
      
      <div className="dashboard-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          {user.role === 'user' && (
            <>
              <Link to="/menu" className="action-card">
                <h3>View Menu</h3>
                <p>Check out our delicious catering options</p>
              </Link>
              <Link to="/order" className="action-card">
                <h3>Place Order</h3>
                <p>Order catering for your next event</p>
              </Link>
              <Link to="/order-history" className="action-card">
                <h3>Order History</h3>
                <p>View your previous orders</p>
              </Link>
            </>
          )}
          {user.role === 'admin' && (
            <>
              <Link to="/admin/menu" className="action-card">
                <h3>Manage Menu</h3>
                <p>Add, edit, or remove menu items</p>
              </Link>
              <Link to="/admin/orders" className="action-card">
                <h3>Manage Orders</h3>
                <p>View and update all orders</p>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;