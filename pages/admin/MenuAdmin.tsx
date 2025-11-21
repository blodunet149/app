import React, { useState, useEffect } from 'react';
import { BACKEND_API_URL } from '@config/api';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  photoUrl: string;
  available: boolean;
}

const MenuAdminPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/menu`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const itemData = {
      name,
      description: description || '',
      price: parseFloat(price),
      photoUrl: photoUrl || '',
      available
    };

    try {
      let response;
      if (editingItem) {
        response = await fetch(`${BACKEND_API_URL}/menu/${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(itemData),
        });
      } else {
        response = await fetch(`${BACKEND_API_URL}/menu`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(itemData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        resetForm();
        fetchMenuItems(); // Refresh the list
        
        if (editingItem) {
          alert('Menu item updated successfully!');
        } else {
          alert('Menu item created successfully!');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save menu item');
      }
    } catch (err) {
      setError('An error occurred while saving the menu item');
      console.error(err);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setPrice(item.price.toString());
    setPhotoUrl(item.photoUrl);
    setAvailable(item.available);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        const response = await fetch(`${BACKEND_API_URL}/menu/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchMenuItems(); // Refresh the list
          alert('Menu item deleted successfully!');
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to delete menu item');
        }
      } catch (err) {
        console.error('Error deleting menu item:', err);
        alert('An error occurred while deleting the menu item');
      }
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setPhotoUrl('');
    setAvailable(true);
    setEditingItem(null);
    setShowForm(false);
    setError('');
  };

  if (loading) {
    return <div>Loading menu items...</div>;
  }

  return (
    <div className="admin-page menu-admin-page">
      <h1>Menu Management</h1>
      
      <button onClick={() => setShowForm(!showForm)} className="add-btn">
        {showForm ? 'Cancel' : 'Add New Menu Item'}
      </button>
      
      {showForm && (
        <form onSubmit={handleSubmit} className="menu-form">
          <h2>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
          {error && <div className="error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="price">Price:</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
              min="0"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="photoUrl">Photo URL:</label>
            <input
              type="text"
              id="photoUrl"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
              />
              Available for ordering
            </label>
          </div>
          
          <button type="submit">
            {editingItem ? 'Update Menu Item' : 'Add Menu Item'}
          </button>
        </form>
      )}
      
      <div className="menu-items-list">
        <h2>Menu Items</h2>
        {menuItems.length > 0 ? (
          <table className="menu-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.description}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>{item.available ? 'Yes' : 'No'}</td>
                  <td>
                    <button onClick={() => handleEdit(item)} className="edit-btn">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="delete-btn">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No menu items found.</p>
        )}
      </div>
    </div>
  );
};

export default MenuAdminPage;