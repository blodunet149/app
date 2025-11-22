const testPaymentWithAuth = async () => {
  console.log('Testing payment transaction creation with proper authentication...');
  
  // We need to handle cookies manually since fetch in Node.js doesn't handle them automatically
  let cookies = '';
  
  console.log('\nStep 1: Logging in to get authentication cookies...');
  
  try {
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

    console.log('Login response status:', loginResponse.status);
    
    // Extract cookies from response headers
    const setCookieHeaders = loginResponse.headers.get('set-cookie');
    if (setCookieHeaders) {
      console.log('Received cookies from login');
      // Extract just the cookie name=value pairs
      cookies = setCookieHeaders.split(',').map(cookie => {
        return cookie.split(';')[0];
      }).join('; ');
      console.log('Cookies to use:', cookies);
    }
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('Login successful for user:', loginData.user);
    } else {
      const errorData = await loginResponse.json();
      console.log('Login failed:', errorData);
      return;
    }
    
    console.log('\nStep 2: Creating payment transaction with authentication...');
    
    // Create payment transaction with the authentication cookies
    const paymentResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/payment/create-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies  // Include the authentication cookies
      },
      body: JSON.stringify({
        orderId: 1,  // Using a test order ID
        amount: 100000,  // 100,000 IDR
        customerDetails: {
          firstName: 'Test',
          lastName: 'Customer',
          email: 'test@example.com',
          phone: '+6281234567890'
        }
      })
    });

    console.log('\nPayment response status:', paymentResponse.status);
    console.log('Payment response headers:', [...paymentResponse.headers.entries()]);
    
    const paymentText = await paymentResponse.text();
    console.log('Payment response body:', paymentText);
    
    if (paymentResponse.status === 500) {
      console.log('\n❌ Received 500 Internal Server Error! This confirms the issue.');
      console.log('The problem is likely related to Midtrans configuration or missing order.');
    } else if (paymentResponse.status === 400 || paymentResponse.status === 404) {
      console.log('\n⚠️  Received client error. This might be because order #1 does not exist.');
    }
    
  } catch (error) {
    console.error('❌ Error during payment transaction test:', error.message);
  }
};

testPaymentWithAuth();