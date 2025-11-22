// pages/admin/reports/OrderSummaryPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import { getOrderSummary } from '../../../src/api/admin/reports';
import OrderStatusManager from '../../../components/admin/OrderStatusManager';
import StatusChart from '../../../components/admin/StatusChart';

const OrderSummaryPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentStatus: ''
  });

  useEffect(() => {
    fetchSummary();
  }, [filters.startDate, filters.endDate, filters.paymentStatus]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await getOrderSummary(
        filters.startDate || undefined,
        filters.endDate || undefined,
        filters.paymentStatus || undefined
      );
      setSummary(data.summary);
      setOrders(data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      paymentStatus: ''
    });
  };

  const calculateStatusCounts = (orderList: any[]) => {
    const statusCounts: Record<string, number> = {};

    orderList.forEach(order => {
      const status = order.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return statusCounts;
  };

  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin access only.</div>;
  }

  if (loading) return <div className="loading">Loading order summary...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="order-summary-page">
      <h1>Order Summary</h1>
      
      <div className="filters">
        <h2>Filters</h2>
        <div className="filter-group">
          <label>
            Start Date:
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </label>
          
          <label>
            End Date:
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </label>
          
          <label>
            Payment Status:
            <select
              name="paymentStatus"
              value={filters.paymentStatus}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="unpaid">Unpaid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          
          <button onClick={resetFilters} className="btn btn-secondary">Reset</button>
          <button onClick={fetchSummary} className="btn btn-primary">Apply Filters</button>
        </div>
      </div>
      
      <div className="summary-stats">
        <h2>Summary Statistics</h2>
        <div className="stats-grid">
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
      </div>
      
      <div className="orders-list">
        <div className="section-header">
          <h2>Orders</h2>
          <StatusChart statusCounts={calculateStatusCounts(orders)} />
        </div>
        <div className="table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Menu</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Payment Status</th>
                <th>Order Date</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.userName}</td>
                  <td>{order.menuName}</td>
                  <td>{order.quantity}</td>
                  <td>Rp {order.totalPrice?.toLocaleString()}</td>
                  <td>
                    <OrderStatusManager
                      orderId={order.id}
                      currentStatus={order.status}
                      onUpdate={() => fetchSummary()}
                    />
                  </td>
                  <td>{order.paymentStatus}</td>
                  <td>{order.orderDate}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryPage;