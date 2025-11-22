// pages/admin/reports/CookingSchedulePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import { getCookingSchedule, getPaidCookingSchedule } from '../../../src/api/admin/reports';

const CookingSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const [cookingSchedule, setCookingSchedule] = useState<any>(null);
  const [paidSchedule, setPaidSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showType, setShowType] = useState<'all' | 'paid'>('all');

  useEffect(() => {
    fetchSchedule();
  }, [selectedDate]);

  const fetchSchedule = async () => {
    if (!selectedDate) {
      // Use today's date if none selected
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch both all orders and paid orders
      const [allSchedule, paidScheduleData] = await Promise.allSettled([
        getCookingSchedule(selectedDate),
        getPaidCookingSchedule(selectedDate)
      ]);
      
      if (allSchedule.status === 'fulfilled') {
        setCookingSchedule(allSchedule.value);
      } else {
        console.error('Error fetching all schedule:', allSchedule.reason);
      }
      
      if (paidScheduleData.status === 'fulfilled') {
        setPaidSchedule(paidScheduleData.value);
      } else {
        console.error('Error fetching paid schedule:', paidScheduleData.reason);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cooking schedule');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div>Access denied. Admin access only.</div>;
  }

  if (loading && !selectedDate) return <div className="loading">Setting up date...</div>;
  if (loading) return <div className="loading">Loading cooking schedule...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const currentSchedule = showType === 'all' ? cookingSchedule : paidSchedule;
  const scheduleName = showType === 'all' ? 'All Orders' : 'Paid Orders Only';

  return (
    <div className="cooking-schedule-page">
      <h1>Cooking Schedule</h1>
      
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
        
        <div className="view-toggle">
          <label>
            View:
            <select 
              value={showType} 
              onChange={(e) => setShowType(e.target.value as 'all' | 'paid')}
            >
              <option value="all">All Orders</option>
              <option value="paid">Paid Orders Only</option>
            </select>
          </label>
        </div>
        
        <button onClick={fetchSchedule} className="btn btn-primary">Refresh</button>
      </div>
      
      {currentSchedule ? (
        <>
          <div className="schedule-summary">
            <h2>{scheduleName} for {currentSchedule.date}</h2>
            <div className="summary-stats">
              <div className="stat-card">
                <h3>Total Orders</h3>
                <p className="stat-number">{currentSchedule.totalOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="menu-breakdown">
            <h2>Menu Breakdown</h2>
            {currentSchedule.menuBreakdown && currentSchedule.menuBreakdown.length > 0 ? (
              <div className="menu-grid">
                {currentSchedule.menuBreakdown.map((menu: any) => (
                  <div key={menu.menuName} className="menu-item">
                    <h3>{menu.menuName}</h3>
                    <p className="total-quantity">Total Quantity: {menu.totalQuantity}</p>
                    <div className="menu-orders">
                      <h4>Orders ({menu.orders.length})</h4>
                      <ul>
                        {menu.orders.map((order: any) => (
                          <li key={order.id}>
                            <span className="user-name">{order.userName}</span> - 
                            <span className="quantity">Qty: {order.quantity}</span>
                            {order.specialInstructions && (
                              <span className="special-instruction">[Note: {order.specialInstructions}]</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No orders scheduled for this date.</p>
            )}
          </div>
          
          <div className="all-orders-list">
            <h2>All Orders for {currentSchedule.date}</h2>
            <div className="table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Menu</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Payment Status</th>
                    <th>Special Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSchedule.orders && currentSchedule.orders.map((order: any) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.userName}</td>
                      <td>{order.menuName}</td>
                      <td>{order.quantity}</td>
                      <td>{order.status}</td>
                      <td>{order.paymentStatus}</td>
                      <td>{order.specialInstructions || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="no-data">
          <p>No schedule data available for the selected date.</p>
        </div>
      )}
    </div>
  );
};

export default CookingSchedulePage;