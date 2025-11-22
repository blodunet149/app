const testStatusUpdate = async () => {
  console.log('Testing payment status update...');
  
  let cookies = '';
  
  // Login first
  console.log('\nStep 1: Logging in...');
  
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
    console.log('Login successful');
  } else {
    console.log('Login failed');
    return;
  }
  
  // Let's try getting the order history to see the current state
  console.log('\nStep 2: Getting order history...');
  
  const historyResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/history', {
    headers: {
      'Cookie': cookies
    }
  });
  
  console.log('Order history status:', historyResponse.status);
  const historyText = await historyResponse.text();
  console.log('Order history preview:', historyText.substring(0, 300) + '...');
  
  if (historyResponse.ok) {
    try {
      const historyData = JSON.parse(historyText);
      if (Array.isArray(historyData.orders) && historyData.orders.length > 0) {
        const recentOrder = historyData.orders[0]; // Get most recent order
        console.log('\nMost recent order:');
        console.log('- ID:', recentOrder.id);
        console.log('- Total Price:', recentOrder.totalPrice);
        console.log('- Status:', recentOrder.status);
        console.log('- Payment Status:', recentOrder.paymentStatus);
        console.log('- Payment ID:', recentOrder.paymentId);
        console.log('- Payment Token:', recentOrder.paymentToken);
        console.log('- Payment URL:', recentOrder.paymentUrl);
        
        // Now try to check payment status for this order
        console.log('\nStep 3: Checking payment status for this order...');
        
        const statusResponse = await fetch(`https://catering.hijrah-attauhid.or.id/api/payment/status/${recentOrder.id}`, {
          headers: {
            'Cookie': cookies
          }
        });
        
        console.log('Status response status:', statusResponse.status);
        const statusText = await statusResponse.text();
        console.log('Status response:', statusText);
      }
    } catch (e) {
      console.log('Error parsing history response:', e.message);
    }
  }
};

testStatusUpdate();