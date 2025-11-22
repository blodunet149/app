// components/admin/OrderStatusManager.tsx
import React, { useState } from 'react';
import { updateOrderStatus, markOrderReady } from '../../src/api/admin/reports';

interface OrderStatusManagerProps {
  orderId: number;
  currentStatus: string;
  onUpdate: () => void; // Callback to refresh data after update
}

const OrderStatusManager: React.FC<OrderStatusManagerProps> = ({ 
  orderId, 
  currentStatus, 
  onUpdate 
}) => {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validStatuses = [
    'pending',
    'confirmed', 
    'preparing',
    'ready',
    'delivered', 
    'cancelled'
  ];

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await updateOrderStatus(orderId, newStatus);
      setStatus(newStatus);
      onUpdate(); // Refresh parent data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsReady = async () => {
    setIsUpdating(true);
    setError(null);
    
    try {
      await markOrderReady(orderId);
      // This will change status from "preparing" to "ready"
      setStatus('ready');
      onUpdate(); // Refresh parent data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as ready');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="order-status-manager">
      <div className="status-display">
        <span className={`status-badge status-${status}`}>
          {status}
        </span>
      </div>
      
      <div className="status-controls">
        <select 
          value={status} 
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isUpdating}
          className="status-select"
        >
          {validStatuses.map(validStatus => (
            <option key={validStatus} value={validStatus}>
              {validStatus.charAt(0).toUpperCase() + validStatus.slice(1)}
            </option>
          ))}
        </select>
        
        {status === 'preparing' && (
          <button 
            onClick={handleMarkAsReady}
            disabled={isUpdating}
            className="btn btn-success mark-ready-btn"
          >
            Mark Ready
          </button>
        )}
      </div>
      
      {error && (
        <div className="status-error">
          Error: {error}
        </div>
      )}
      
      {isUpdating && (
        <div className="status-updating">
          Updating...
        </div>
      )}
    </div>
  );
};

export default OrderStatusManager;