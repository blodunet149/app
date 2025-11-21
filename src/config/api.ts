// src/config/api.ts
export const API_BASE_URL = typeof window !== 'undefined' 
  ? '/api'  // For production when deployed with the same domain
  : 'https://catering-app.blodunet149.workers.dev/api';  // For development or when they are separate

// In production with Cloudflare Pages, you'll need to update this to your deployed backend URL
export const BACKEND_API_URL = 'https://catering-app.blodunet149.workers.dev/api';