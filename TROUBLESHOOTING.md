# Troubleshooting Production 500 Error

## Issue
The order endpoint is returning a 500 Internal Server Error on the production domain:
https://catering.hijrah-attauhid.or.id/api/order

## Root Cause Analysis
The error is likely occurring because:

1. The production worker wasn't properly updated with the new code containing Midtrans integration
2. The production worker doesn't have the `nodejs_compat` compatibility flag set
3. The environment variables are not properly configured in production
4. The Midtrans dependencies are causing issues in the production environment

## Solution Steps

### Step 1: Verify Production Worker Configuration
1. Log in to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Find your production worker (`catering-app-production`)
4. Check the "Settings" tab
5. Ensure the "Compatibility date" is set to 2024-12-01 or later
6. Ensure the "Compatibility flags" include `nodejs_compat`

### Step 2: Update Environment Variables in Production
1. In the Cloudflare Dashboard, go to your production worker
2. Navigate to Settings > Environment Variables
3. Make sure these variables are set:
   - NODE_ENV = "production" (or "development" for testing)
   - JWT_SECRET = "your-jwt-secret"
   - MIDTRANS_SERVER_KEY = "your-midtrans-server-key"
   - MIDTRANS_CLIENT_KEY = "your-midtrans-client-key"

### Step 3: Redeploy Updated Code to Production
If you have access to redeploy the worker, update your wrangler.toml to use the correct environment:

For a fresh deployment (if the route becomes available):
```bash
npx wrangler deploy --env=production
```

### Step 4: Check Worker Logs
1. In Cloudflare Dashboard
2. Go to your worker's page
3. Click on Logs to see the specific error causing the 500 error

### Step 5: Quick Fix Option
If you cannot redeploy, you can update the worker in the Cloudflare Workers editor:
1. Copy the current functions/api/order.ts code
2. Make sure the paymentStatus is properly initialized to 'unpaid'
3. Check for any missing imports or dependencies

## Alternative Temporary Solution
If the above doesn't work, you can temporarily remove the Midtrans initialization from the order flow to restore basic functionality while working on the deployment:

The error might be caused by trying to import Midtrans modules in the order.ts file, even though we didn't modify the order.ts file to directly use Midtrans. 

Actually, looking at our implementation again, we only added paymentStatus to the order creation, which shouldn't cause a 500 error. The error might be occurring somewhere else. 

Let me check if there might be an issue with the schema import:

The order.ts file should be updated to match the schema changes. Let's make sure the order creation properly handles the new payment fields:

```typescript
// In the order creation in order.ts, the values should include:
paymentStatus: 'unpaid', // Default payment status is unpaid
```

This should be fine since it's just a simple string value that matches the database schema.

## Immediate Actions Required

1. Check the runtime logs in Cloudflare Dashboard for the exact error message
2. Verify that the production worker has the `nodejs_compat` flag enabled
3. Ensure the database schema is properly migrated to include the new payment fields
4. If needed, temporarily disable the payment functionality to restore basic order functionality