// src/config/api.ts
export const API_BASE_URL = typeof window !== 'undefined'
  ? '/api'  // For production when deployed with the same domain
  : 'https://catering.hijrah-attauhid.or.id/api';  // Using custom domain

// Production API URL with custom domain
export const BACKEND_API_URL = 'https://catering.hijrah-attauhid.or.id/api';