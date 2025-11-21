import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { BACKEND_API_URL } from '@config/api';

interface Order {
  id: number;
  userId: number;
  menuId: number;
  quantity: number;
  orderDate: string;
  specialInstructions: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  menuName: string;
  menuDescription: string;
  menuPrice: number;
  menuPhotoUrl: string;
}

const OrdersAdminPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/order/all`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/order/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        // Update the order in the local state
        setOrders(orders.map(order => 
          order.id === orderId ? updatedOrder.order : order
        ));
        alert('Order status updated successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('An error occurred while updating the order status');
    }
  };

  // Filter orders based on selected status
  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="admin-page orders-admin-page">
      <h1>Order Management</h1>
      
      <div className="filter-section">
        <label htmlFor="statusFilter">Filter by status:</label>
        <select 
          id="statusFilter"
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      
      {filteredOrders.length > 0 ? (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>Order #{order.id} - <span className={`status ${order.status}`}>{order.status}</span></h3>
                <p>By: {order.userName} ({order.userEmail})</p>
              </div>
              
              <div className="order-details">
                {order.menuPhotoUrl && (
                  <img src={order.menuPhotoUrl} alt={order.menuName} className="order-photo" />
                )}
                <div className="order-info">
                  <h4>{order.menuName}</h4>
                  <p>{order.menuDescription}</p>
                  <p><strong>Quantity:</strong> {order.quantity}</p>
                  <p><strong>Delivery Date:</strong> {format(new Date(order.orderDate), 'EEE, MMM d, yyyy')}</p>
                  <p><strong>Total:</strong> ${order.totalPrice.toFixed(2)}</p>
                  {order.specialInstructions && (
                    <p><strong>Special Instructions:</strong> {order.specialInstructions}</p>
                  )}
                  <p><strong>Ordered on:</strong> {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>
              
              <div className="order-actions">
                <label htmlFor={`status-${order.id}`}>Update Status:</label>
                <select
                  id={`status-${order.id}`}
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No orders found.</p>
      )}
    </div>
  );
};

export default OrdersAdminPage;