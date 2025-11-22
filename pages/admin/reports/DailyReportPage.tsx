// pages/admin/reports/DailyReportPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import { getDailyReport } from '../../../src/api/admin/reports';
import OrderStatusManager from '../../../components/admin/OrderStatusManager';
import StatusChart from '../../../components/admin/StatusChart';

const DailyReportPage: React.FC = () => {
  const { user } = useAuth();
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    fetchReport();
  }, [selectedDate]);

  const fetchReport = async () => {
    if (!selectedDate) {
      // Use today's date if none selected
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const report = await getDailyReport(selectedDate);
      setDailyReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch daily report');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin access only.</div>;
  }

  if (loading && !selectedDate) return <div className="loading">Setting up date...</div>;
  if (loading) return <div className="loading">Loading daily report...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="daily-report-page">
      <h1>Daily Report</h1>
      
      <div className="controls">
        <div className="date-selector">
          <label>
            Select Date:
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </label>
        </div>
        
        <button onClick={fetchReport} className="btn btn-primary">Generate Report</button>
      </div>
      
      {dailyReport && (
        <>
          <div className="report-header">
            <h2>Daily Report for {dailyReport.date}</h2>
          </div>
          
          <div className="summary-stats">
            <h3>Summary Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Total Orders</h4>
                <p className="stat-number">{dailyReport.statistics.totalOrders}</p>
              </div>
              <div className="stat-card">
                <h4>Total Quantities</h4>
                <p className="stat-number">{dailyReport.statistics.totalQuantities}</p>
              </div>
              <div className="stat-card">
                <h4>Total Revenue</h4>
                <p className="stat-number">Rp {dailyReport.statistics.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="stat-card">
                <h4>Paid Orders</h4>
                <p className="stat-number">{dailyReport.statistics.totalPaidOrders}</p>
              </div>
              <div className="stat-card">
                <h4>Unpaid Orders</h4>
                <p className="stat-number">{dailyReport.statistics.unpaidOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="status-breakdown">
            <h3>Orders by Status</h3>
            <StatusChart statusCounts={dailyReport.statistics.statusCounts} />
          </div>
          
          <div className="menu-breakdown">
            <h3>Menu Breakdown</h3>
            {dailyReport.menuBreakdown && dailyReport.menuBreakdown.length > 0 ? (
              <div className="menu-grid">
                {dailyReport.menuBreakdown.map((menu: any, index: number) => (
                  <div key={index} className="menu-item">
                    <h4>{menu.menuName}</h4>
                    <p>Total Quantity: {menu.totalQuantity}</p>
                    <p>Number of Orders: {menu.orders.length}</p>
                    {menu.specialInstructions && menu.specialInstructions.length > 0 && (
                      <div className="special-instructions">
                        <h5>Special Instructions:</h5>
                        <ul>
                          {menu.specialInstructions.map((instruction: any, idx: number) => (
                            <li key={idx}>
                              <strong>{instruction.userName}:</strong> {instruction.instruction}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No menu items for this date.</p>
            )}
          </div>
          
          <div className="all-orders">
            <h3>All Orders</h3>
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
                    <th>Special Instructions</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyReport.orders && dailyReport.orders.map((order: any) => (
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
                          onUpdate={() => fetchReport()}
                        />
                      </td>
                      <td>{order.paymentStatus}</td>
                      <td>{order.specialInstructions || '-'}</td>
                      <td>{new Date(order.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DailyReportPage;