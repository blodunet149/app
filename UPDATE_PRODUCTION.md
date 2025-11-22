# Updating Production with Midtrans Integration

Your application has been successfully deployed to Cloudflare Workers with Midtrans integration! Here's what you need to know:

## Current Status
- The Midtrans integration is now deployed and working
- The application is currently using sandbox mode with sandbox credentials
- The worker is deployed as `catering-app.yayasan-attauhid-1.workers.dev`

## To Update Production with Live Credentials:

1. **Log into Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Navigate to Workers & Pages

2. **Update Environment Variables for Production**
   - Find your `catering-app-production` worker
   - Go to Settings > Environment Variables
   - Update the following variables:
     - `MIDTRANS_SERVER_KEY`: Your production Midtrans server key
     - `MIDTRANS_CLIENT_KEY`: Your production Midtrans client key
     - `NODE_ENV`: Set to "production" (to enable production mode)

3. **Wait for Deployment**
   - Changes to environment variables take effect immediately
   - No need to redeploy the worker code

## For Testing Before Production:

Since you have sandbox credentials already deployed, you can test the payment flow right away:
- The system is currently running in sandbox mode
- You can place orders and test payment flows with test cards
- All functionality is implemented and working

## Webhook Configuration:

Remember to configure the webhook in your Midtrans dashboard:
- URL: `https://catering.hijrah-attauhid.or.id/api/payment/notification`
- This will automatically process payment status updates

## Testing Webhooks:

You can test the webhook manually by sending a test notification to:
`POST https://catering.hijrah-attauhid.or.id/api/payment/notification`

## Important Notes:

- The system automatically detects NODE_ENV and switches between sandbox and production mode
- When NODE_ENV is "production", the system will use production Midtrans APIs
- When NODE_ENV is "development", it will use sandbox APIs
- Webhooks will work in both environments

## Midtrans Test Card Details (for current sandbox testing):
- Card Number: 4811 1111 1111 1114
- CVV: 123
- Expiry: 12/25
- OTP: 123456