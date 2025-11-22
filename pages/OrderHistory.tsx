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
  paymentStatus: string;
  paymentId?: string;
  paymentToken?: string;
  paymentUrl?: string;
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

  const getClientKey = async (): Promise<string> => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/payment/config`);
      if (response.ok) {
        const data = await response.json();
        return data.clientKey;
      } else {
        throw new Error('Failed to get Midtrans client key');
      }
    } catch (error) {
      console.error('Error fetching client key:', error);
      throw error;
    }
  };

  const initiatePayment = async (orderId: number, amount: number) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/payment/create-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
          customerDetails: {
            firstName: 'Customer',
            email: 'customer@example.com',
            phone: '+6281234567890',
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Redirect to Midtrans payment page or use Snap.js popup
        if (result.redirectUrl) {
          // Redirect to payment page
          window.location.href = result.redirectUrl;
        } else if (result.token) {
          // Get client key from backend
          const clientKey = await getClientKey();

          // Use Midtrans Snap.js for popup payment
          const snapScript = document.createElement('script');
          snapScript.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
          snapScript.setAttribute('data-client-key', clientKey);
          document.body.appendChild(snapScript);

          snapScript.onload = () => {
            // @ts-ignore - Midtrans creates window.snap
            window.snap.pay(result.token, {
              onSuccess: function(result: any) {
                console.log('Payment Success:', result);
                // Refresh the order list to update payment status
                window.location.reload();
              },
              onPending: function(result: any) {
                console.log('Waiting for payment:', result);
                // Refresh the order list to update payment status
                window.location.reload();
              },
              onError: function(result: any) {
                console.log('Payment Error:', result);
                alert('Payment failed. Please try again.');
              },
              onClose: function() {
                console.log('Customer closed the popup without finishing the payment');
                alert('Payment was cancelled. You can continue with payment later.');
              }
            });
          };
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to initiate payment');
      }
    } catch (err) {
      alert('An error occurred while initiating payment');
      console.error(err);
    }
  };

  return (
    <div className="order-history-page">
      <h1>Order History</h1>
      {orders.length > 0 ? (
        <div className="order-list">
          {orders.map(order => (
            <div key={order.id} className="order-item">
              <div className="order-header">
                <h3>Order #{order.id}</h3>
                <div className="status-container">
                  <span className={`status ${order.status}`}>{order.status.toUpperCase()}</span>
                  <span className={`payment-status ${order.paymentStatus}`}>Payment: {order.paymentStatus.toUpperCase()}</span>
                </div>
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

                  {/* Payment section */}
                  {order.paymentStatus !== 'paid' && (
                    <div className="payment-actions">
                      {order.paymentStatus === 'unpaid' || order.paymentStatus === 'pending' ? (
                        <button
                          className="pay-button"
                          onClick={() => initiatePayment(order.id, order.totalPrice)}
                        >
                          Pay Now
                        </button>
                      ) : null}

                      {order.paymentUrl && order.paymentStatus === 'pending' && (
                        <a
                          href={order.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="payment-link"
                        >
                          Complete Payment
                        </a>
                      )}
                    </div>
                  )}
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

// Add CSS styles for payment elements if not already defined in your CSS
// You can add these styles to your main CSS file
export default OrderHistoryPage;