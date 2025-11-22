// components/admin/StatusChart.tsx
import React from 'react';

interface StatusChartProps {
  statusCounts: Record<string, number>;
}

const StatusChart: React.FC<StatusChartProps> = ({ statusCounts }) => {
  // Calculate total orders
  const totalOrders = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  
  // Define status colors
  const statusColors: Record<string, string> = {
    pending: '#ffc107',
    confirmed: '#17a2b8',
    preparing: '#0d6efd',
    ready: '#28a745',
    delivered: '#20c997',
    cancelled: '#dc3545'
  };

  // Calculate percentages
  const statusPercentages = Object.entries(statusCounts).map(([status, count]) => {
    const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
    return {
      status,
      count,
      percentage,
      color: statusColors[status] || '#6c757d'
    };
  });

  return (
    <div className="status-chart">
      <div className="chart-legend">
        {statusPercentages.map(({ status, count, percentage, color }) => (
          <div key={status} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: color }}></div>
            <span className="legend-label">
              {status} ({count}) - {percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
      
      <div className="chart-bar-container">
        {statusPercentages.map(({ status, percentage, color }) => (
          <div 
            key={status} 
            className="chart-bar-segment" 
            style={{ 
              width: `${percentage}%`, 
              backgroundColor: color,
              minWidth: percentage > 0 ? '20px' : '0px'  // Ensure visibility even for small percentages
            }}
            title={`${status}: ${percentage.toFixed(1)}%`}
          ></div>
        ))}
      </div>
      
      <div className="chart-info">
        <span>Total Orders: {totalOrders}</span>
      </div>
    </div>
  );
};

export default StatusChart;