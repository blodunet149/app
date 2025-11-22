// pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../src/hooks/useAuth';
import { getOrderSummary } from '../../src/api/admin/reports';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await getOrderSummary();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin access only.</div>;
  }

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-number">{summary.totalOrders}</p>
        </div>
        <div className="stat-card">
          <h3>Paid Orders</h3>
          <p className="stat-number">{summary.totalPaidOrders}</p>
        </div>
        <div className="stat-card">
          <h3>Unpaid Orders</h3>
          <p className="stat-number">{summary.totalUnpaidOrders}</p>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-number">Rp {summary.totalRevenue.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="dashboard-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/admin/reports/summary" className="btn btn-primary">View Order Summary</Link>
          <Link to="/admin/reports/cooking-schedule" className="btn btn-primary">View Cooking Schedule</Link>
          <Link to="/admin/reports/daily-report" className="btn btn-primary">Daily Report</Link>
          <Link to="/admin/orders" className="btn btn-primary">Manage Orders</Link>
        </div>
      </div>
      
      <div className="dashboard-info">
        <h2>Overview</h2>
        <p>This dashboard provides an overview of your catering business operations.</p>
        <p>From here you can manage orders, view reports, and monitor cooking schedules.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;