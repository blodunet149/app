import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { BACKEND_API_URL } from '@config/api';

interface Order {
  id: number;
  menuId: number;
  quantity: number;
  orderDate: string;
  specialInstructions: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  menuName: string;
  menuDescription: string;
  menuPrice: number;
  menuPhotoUrl: string;
}

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        const response = await fetch(`${BACKEND_API_URL}/order/history`);
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders);
        }
      } catch (error) {
        console.error('Error fetching order history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, []);

  if (loading) {
    return <div>Loading order history...</div>;
  }

  return (
    <div className="order-history-page">
      <h1>Order History</h1>
      {orders.length > 0 ? (
        <div className="order-list">
          {orders.map(order => (
            <div key={order.id} className="order-item">
              <div className="order-header">
                <h3>Order #{order.id}</h3>
                <span className={`status ${order.status}`}>{order.status.toUpperCase()}</span>
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
            </div>
          ))}
        </div>
      ) : (
        <p>No orders found. <a href="/order">Place your first order</a>!</p>
      )}
    </div>
  );
};

export default OrderHistoryPage;