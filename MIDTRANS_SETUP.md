# Midtrans Payment Integration Setup

## Overview
This document explains how to set up and configure Midtrans payment integration for the catering application.

## Configuration

### 1. Midtrans Account Setup
1. Go to [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com/)
2. Create a sandbox account if you don't have one
3. Obtain your Server Key and Client Key from the dashboard

### 2. Environment Variables
Add the following variables to your `wrangler.toml` file in the `[vars]` section:

```toml
[vars]
MIDTRANS_SERVER_KEY = "SB-Mid-server-7zFTzyxPHcDaj19-KhQ_CPGV"
MIDTRANS_CLIENT_KEY = "SB-Mid-client-8LumxhWCUi6hVWMv"
```

For local development, you may need to use environment variables or update the keys directly in:
- `/workspaces/app/functions/api/payment.ts`
- `/workspaces/app/pages/Order.tsx`
- `/workspaces/app/pages/OrderHistory.tsx`

### 3. Webhook Configuration
1. In your Midtrans dashboard, go to Settings > Configuration
2. Set your notification URL to: `https://your-domain.com/api/payment/notification`
   - For local development: `https://your-tunnel-url/api/payment/notification` (using ngrok)
   
## Testing the Integration

### 1. Local Development Setup
1. Start your development server: `npm run dev`
2. If testing webhooks locally, use ngrok to create a public URL:
   ```
   npx ngrok http 8787
   ```
3. Update your Midtrans dashboard with the ngrok URL for webhook testing

### 2. Frontend Testing
1. Place an order using the frontend
2. The system should automatically redirect to Midtrans payment page or open the Snap popup
3. Use the following test card credentials:
   - Card Number: 4811 1111 1111 1114
   - CVV: 123
   - Expiry: 12/25
   - OTP: 123456

### 3. Payment Flow Testing
1. Place an order (status: pending, payment: unpaid)
2. Complete payment via Midtrans (status: confirmed, payment: paid)
3. Check the order history page to see updated payment status
4. Test webhook by simulating payment completion

## API Endpoints

### Payment Endpoints
- `POST /api/payment/create-transaction` - Create a new payment transaction
- `GET /api/payment/status/:orderId` - Get payment status for an order
- `POST /api/payment/notification` - Webhook endpoint for Midtrans notifications

### Updated Order Endpoints
- `POST /api/order` - Creates order with default payment status 'unpaid'
- `GET /api/order/history` - Now includes payment information

## Frontend Components

### Order Page
- Updated to automatically initiate payment after order creation
- Added payment flow handling
- Shows payment loading state

### Order History Page
- Now displays payment status
- Provides "Pay Now" button for unpaid orders
- Shows payment links for pending payments

## Database Changes

Added the following fields to the `orders` table:
- `paymentStatus`: Enum (unpaid, pending, paid, cancelled, refunded, partial_refund)
- `paymentId`: Midtrans transaction ID
- `paymentToken`: Payment token for client-side transactions
- `paymentUrl`: Payment URL for redirect

## Troubleshooting

### Common Issues
1. **Payment not redirecting**: Check that your client key is properly set
2. **Webhook not working**: Verify your notification URL in Midtrans dashboard
3. **CORS errors**: Check your Cloudflare Worker CORS configuration
4. **Test transactions not working**: Ensure you're using sandbox credentials

### Debugging Payment Status
To manually check payment status, use:
`GET /api/payment/status/:orderId`

## Security Considerations
- Never expose your Server Key in client-side code
- Validate payment status on your server before updating order status
- Use HTTPS for production deployments