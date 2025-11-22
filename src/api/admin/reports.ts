// src/api/admin/reports.ts
import { BACKEND_API_URL } from '../../config/api';

export interface OrderSummary {
  totalOrders: number;
  totalPaidOrders: number;
  totalUnpaidOrders: number;
  totalRevenue: number;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

export interface OrderForCooking {
  id: number;
  userId: number;
  menuId: number;
  quantity: number;
  orderDate: string;
  specialInstructions: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  userName: string;
  menuName: string;
  menuDescription: string;
}

export interface MenuBreakdown {
  menuName: string;
  totalQuantity: number;
  orders: Array<{
    id: number;
    userId: number;
    userName: string;
    quantity: number;
    specialInstructions: string;
    createdAt: string;
  }>;
  specialInstructions: Array<{
    userName: string;
    instruction: string;
  }>;
}

export interface DailyReport {
  date: string;
  totalOrders: number;
  statistics: {
    totalOrders: number;
    totalQuantities: number;
    totalRevenue: number;
    totalPaidOrders: number;
    unpaidOrders: number;
    statusCounts: Record<string, number>;
  };
  menuBreakdown: MenuBreakdown[];
  orders: OrderForCooking[];
}

export interface CookingSchedule {
  date: string;
  totalOrders: number;
  menuBreakdown: MenuBreakdown[];
  orders: OrderForCooking[];
}

export interface OrderStatusUpdate {
  id: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
}

// Get order summary with optional filters
export const getOrderSummary = async (
  startDate?: string,
  endDate?: string,
  paymentStatus?: string
): Promise<{ summary: OrderSummary; orders: any[] }> => {
  let url = `${BACKEND_API_URL}/order/summary`;
  
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (paymentStatus) params.append('paymentStatus', paymentStatus);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch order summary: ${response.statusText}`);
  }

  return response.json();
};

// Get cooking schedule (all orders)
export const getCookingSchedule = async (date?: string): Promise<CookingSchedule> => {
  let url = `${BACKEND_API_URL}/order/for-cooking`;
  
  if (date) {
    const params = new URLSearchParams();
    params.append('date', date);
    url += `?${params.toString()}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch cooking schedule: ${response.statusText}`);
  }

  return response.json();
};

// Get cooking schedule for paid orders only
export const getPaidCookingSchedule = async (date?: string): Promise<CookingSchedule> => {
  let url = `${BACKEND_API_URL}/order/for-cooking-paid`;
  
  if (date) {
    const params = new URLSearchParams();
    params.append('date', date);
    url += `?${params.toString()}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch paid cooking schedule: ${response.statusText}`);
  }

  return response.json();
};

// Get daily report for specific date
export const getDailyReport = async (date: string): Promise<DailyReport> => {
  const response = await fetch(`${BACKEND_API_URL}/order/daily-report/${date}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch daily report: ${response.statusText}`);
  }

  return response.json();
};

// Update order status
export const updateOrderStatus = async (
  orderId: number,
  status: string
): Promise<{ order: OrderStatusUpdate }> => {
  const response = await fetch(`${BACKEND_API_URL}/order/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update order status: ${response.statusText}`);
  }

  return response.json();
};

// Mark order as ready
export const markOrderReady = async (orderId: number): Promise<{ order: OrderStatusUpdate }> => {
  const response = await fetch(`${BACKEND_API_URL}/order/${orderId}/ready`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to mark order as ready: ${response.statusText}`);
  }

  return response.json();
};