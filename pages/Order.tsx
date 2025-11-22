import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  photoUrl: string;
}

interface AvailableDate {
  value: string;
  label: string;
}

const OrderPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch menu items
        const menuResponse = await fetch(`${BACKEND_API_URL}/menu/available`);
        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          setMenuItems(menuData.menuItems);
        }

        // Fetch available dates
        const datesResponse = await fetch(`${BACKEND_API_URL}/available-dates`);
        if (datesResponse.ok) {
          const datesData = await datesResponse.json();
          const formattedDates = datesData.dates.map((dateString: string) => ({
            value: dateString,
            label: format(new Date(dateString), 'EEE, MMM d, yyyy')
          }));
          setAvailableDates(formattedDates);

          // Set the first available date as default selection
          if (formattedDates.length > 0) {
            setSelectedDate(formattedDates[0].value);
          }
        }
      } catch (err) {
        setError('Failed to load menu items or dates');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedItem || !selectedDate) {
      setError('Please select a menu item and date');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menuId: selectedItem,
          quantity,
          orderDate: selectedDate,
          specialInstructions
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentOrder(result.order);
        setOrderSuccess(true);

        // Display success message and show payment button
        // Do not automatically initiate payment to avoid popup blockers
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to place order');
      }
    } catch (err) {
      setError('An error occurred while placing the order');
      console.error(err);
    }
  };

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
                setPaymentSuccess(true);
                setCurrentOrder(prev => prev ? { ...prev, paymentStatus: 'paid' } : null);
                setTimeout(() => navigate('/order-history'), 3000);
              },
              onPending: function(result: any) {
                console.log('Waiting for payment:', result);
                setPaymentSuccess(true);
                setCurrentOrder(prev => prev ? { ...prev, paymentStatus: 'pending' } : null);
                setTimeout(() => navigate('/order-history'), 3000);
              },
              onError: function(result: any) {
                console.log('Payment Error:', result);
                setError('Payment failed. Please try again.');
              },
              onClose: function() {
                console.log('Customer closed the popup without finishing the payment');
                setError('Payment was cancelled. You can continue with payment from order history.');
              }
            });
          };
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to initiate payment');
      }
    } catch (err) {
      setError('An error occurred while initiating payment');
      console.error(err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="order-page">
      <h1>Place an Order</h1>

      {orderSuccess && !paymentSuccess && (
        <div className="success-message">
          Order placed successfully! Initiating payment...
        </div>
      )}

      {paymentSuccess && (
        <div className="success-message">
          Payment completed successfully! Redirecting to order history...
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {!orderSuccess && (
        <form onSubmit={handleSubmit} className="order-form">
          <div className="form-group">
            <label htmlFor="menuItem">Menu Item:</label>
            <select
              id="menuItem"
              value={selectedItem || ''}
              onChange={(e) => setSelectedItem(Number(e.target.value))}
              required
            >
              <option value="">Select a menu item</option>
              {menuItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} - ${item.price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Quantity:</label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Delivery Date:</label>
            <select
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            >
              {availableDates.map(date => (
                <option key={date.value} value={date.value}>
                  {date.label}
                </option>
              ))}
            </select>
            <small className="date-info">
              Orders can be placed from today up to 14 days in advance.
              Weekend dates are not available.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="instructions">Special Instructions (Optional):</label>
            <textarea
              id="instructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
            />
          </div>

          <button type="submit" disabled={orderSuccess}>
            Place Order
          </button>
        </form>
      )}

      {orderSuccess && !paymentSuccess && currentOrder && (
        <div className="order-success-payment">
          <div className="success-message">
            <p>Order #{currentOrder.id} placed successfully!</p>
            <p>Total: ${currentOrder.totalPrice.toFixed(2)}</p>
            <p>Ready to proceed with payment?</p>
          </div>
          <div className="payment-actions">
            <button
              className="pay-now-button"
              onClick={() => initiatePayment(currentOrder.id, currentOrder.totalPrice)}
            >
              Pay Now
            </button>
            <button
              className="view-history-button"
              onClick={() => navigate('/order-history')}
            >
              View Order History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;