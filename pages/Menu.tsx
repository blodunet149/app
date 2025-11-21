import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BACKEND_API_URL } from '@config/api';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  photoUrl: string;
  available: boolean;
}

const MenuPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch(`${BACKEND_API_URL}/menu/available`);
        if (response.ok) {
          const data = await response.json();
          setMenuItems(data.menuItems);
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  if (loading) {
    return <div>Loading menu items...</div>;
  }

  return (
    <div className="menu-page">
      <h1>Our Menu</h1>
      <div className="menu-items">
        {menuItems.length > 0 ? (
          menuItems.map(item => (
            <div key={item.id} className="menu-item">
              {item.photoUrl && (
                <img src={item.photoUrl} alt={item.name} className="menu-item-photo" />
              )}
              <div className="menu-item-info">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <p className="price">${item.price.toFixed(2)}</p>
                {item.available ? (
                  <Link to="/order" className="order-btn">Order Now</Link>
                ) : (
                  <span className="unavailable">Currently Unavailable</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No menu items available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default MenuPage;