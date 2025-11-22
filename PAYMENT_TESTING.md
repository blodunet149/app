# Midtrans Sandbox Payment Testing Guide

## Current Status
- Your application is deployed and working
- Order creation is successful 
- Sandbox keys are properly configured
- Database includes payment fields

## Testing Payment Flow

### Method 1: Direct Payment After Order (Current Implementation)
1. Place order in your application
2. The system should automatically initiate payment after successful order creation
3. Browser may ask permission to show popup if it was blocked
4. Payment should open Midtrans sandbox environment

### Method 2: Manual Payment (Recommended for Testing)
If the popup isn't appearing automatically:

1. Place an order through the order page
2. Go to your Order History page
3. Find the newly created order
4. Click the "Pay Now" button next to the order
5. The payment popup should appear (make sure popup blockers are disabled)

## Troubleshooting Popup Issues

### Popup Blocked by Browser
- Modern browsers block popups that aren't triggered by direct user action
- Try Method 2 above (clicking "Pay Now" after order creation)
- Make sure to allow popups for your site

### Sandbox Test Card Details
Use these details for testing in the Midtrans popup:
- Card Number: 4811 1111 1111 1114
- CVV: 123
- Expiry: 12/25
- OTP: 123456

### Expected Behavior in Sandbox
- After entering test card details, you'll see OTP verification
- Enter 123456 as OTP
- Transaction should complete with success message
- Order status should update automatically via webhook

## Payment Status Flow
1. Order created → paymentStatus: 'unpaid'
2. Payment initiated → paymentStatus: 'pending' 
3. Payment completed → paymentStatus: 'paid' and order status updates to 'confirmed'

## Testing Webhook
To verify webhook functionality:
1. Complete a test payment in sandbox
2. Check if order status updates automatically
3. You can also manually check status: 
   `GET /api/payment/status/{orderId}`

## For Better UX (Optional Enhancement)
Consider updating the flow to:
1. Create order successfully
2. Show success message with "Pay Now" button
3. Initiate payment when user clicks the button (direct user action)
4. This prevents popup blockers and improves user experience

## Environment Variables
Your current configuration uses sandbox keys which is correct for testing:
- Server Key: SB-Mid-server-7zFTzyxPHcDaj19-KhQ_CPGV
- Client Key: SB-Mid-client-8LumxhWCUi6hVWMv

## Production Ready
When you're ready for production:
1. Update environment variables with production Midtrans keys
2. Set NODE_ENV to "production" 
3. Test with real payment methods (in Midtrans production mode)

## Support
If you continue having issues with the payment popup:
1. Check browser console for errors
2. Verify that your domain is properly configured in Midtrans dashboard
3. Make sure popup blockers are disabled for your site