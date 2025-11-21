import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { BACKEND_API_URL } from '@config/api';

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
        setOrderSuccess(true);
        // Reset form after successful order
        setTimeout(() => {
          setOrderSuccess(false);
          setSelectedItem(null);
          setQuantity(1);
          setSpecialInstructions('');
          if (availableDates.length > 0) {
            setSelectedDate(availableDates[0].value);
          }
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to place order');
      }
    } catch (err) {
      setError('An error occurred while placing the order');
      console.error(err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="order-page">
      <h1>Place an Order</h1>

      {orderSuccess && (
        <div className="success-message">
          Order placed successfully! Redirecting to order history...
        </div>
      )}

      {error && <div className="error">{error}</div>}

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
    </div>
  );
};

export default OrderPage;