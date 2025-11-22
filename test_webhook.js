const testWebhook = async () => {
  console.log('=== Testing Webhook Notification ===\n');
  
  // This simulates a webhook call from Midtrans after a successful payment
  const orderId = 27; // Using the order we created
  const transactionId = 'cc2c1a30-ee02-413d-a0f5-885a18f5c3fb'; // The transaction ID from our test
  
  // Simulate Midtrans webhook payload for a successful payment
  // The order_id format in the real transaction was generated with Date.now()
  // Since we can't know the exact timestamp, we'll need to look for the pattern that matches our order
  // In real implementation, the order_id would be something like "order-27-1701234567890"
  // For testing, let's use the transactionId that we know was stored as paymentId
  const webhookPayload = {
    transaction_time: "2025-11-22 09:45:30",
    transaction_status: "settlement", // This indicates successful payment completion
    transaction_id: transactionId,
    status_code: "200",
    status_message: "Success, transaction is found",
    signature_key: "dummy-signature-for-test",
    payment_type: "credit_card",
    order_id: `order-${orderId}-1234567890`, // Simulated format that matches our pattern
    merchant_id: "G81278529",
    masked_card: "481111-1114",
    gross_amount: "10000.00",
    fraud_status: "accept",
    currency: "IDR",
    channel_response_message: "Approved",
    channel_response_code: "00",
    card_type: "credit"
  };

  console.log('Simulating successful payment webhook notification...');
  console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
  
  try {
    const response = await fetch('https://catering.hijrah-attauhid.or.id/api/payment/notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    console.log('\nWebhook response status:', response.status);
    const responseBody = await response.text();
    console.log('Webhook response:', responseBody);
    
    // Now check the order status after the simulated webhook
    console.log('\nChecking order status after simulated webhook...');
    
    // We need to use the authentication cookies to check status
    let cookies = '';
    
    // Login first to get cookies
    const loginResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'user@user.com',
        password: 'user@user.com'
      })
    });

    if (loginResponse.ok) {
      const setCookieHeaders = loginResponse.headers.get('set-cookie');
      if (setCookieHeaders) {
        cookies = setCookieHeaders.split(',').map(cookie => {
          return cookie.split(';')[0];
        }).join('; ');
      }
      
      // Check status after webhook
      const statusResponse = await fetch(`https://catering.hijrah-attauhid.or.id/api/payment/status/${orderId}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      console.log('Status check response status:', statusResponse.status);
      const statusBody = await statusResponse.json();
      console.log('Status after webhook simulation:', statusBody);
      
      // Also check order history to see if status changed
      const historyResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/history', {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        const targetOrder = historyData.orders.find(order => order.id === orderId);
        
        if (targetOrder) {
          console.log('\nOrder history after webhook:');
          console.log('  - Payment Status:', targetOrder.paymentStatus);
          console.log('  - Order Status:', targetOrder.status);
        }
      }
    } else {
      console.log('Login failed, cannot check status');
    }
  } catch (error) {
    console.error('Error during webhook test:', error.message);
  }
};

testWebhook();