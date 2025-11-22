// src/config/api.ts
export const API_BASE_URL = typeof window !== 'undefined'
  ? '/api'  // For production when deployed with the same domain (when frontend and backend are on same domain)
  : 'https://catering.hijrah-attauhid.or.id/api';  // For when frontend is on custom domain but needs to access backend

// For production with custom domain setup
export const BACKEND_API_URL = 'https://catering.hijrah-attauhid.or.id/api';