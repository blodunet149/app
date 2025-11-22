const testPaymentTransaction = async () => {
  console.log('Testing payment transaction creation...');
  
  // First, we need a valid JWT token to authenticate the request
  // Let's try logging in to get a valid token
  
  console.log('\nStep 1: Attempting login to get authentication token...');
  
  try {
    // Login first to get a valid session
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
    
    if (!loginResponse.ok) {
      console.log('Login failed, trying to register first...');
      
      // Try to register the user first
      const registerResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          email: 'user@user.com',
          password: 'user@user.com',
          role: 'user'
        })
      });

      console.log('Register response status:', registerResponse.status);
      const registerData = await registerResponse.json();
      console.log('Register response:', registerData);
      
      // Then try login again
      const retryLoginResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@user.com',
          password: 'user@user.com'
        })
      });
      
      console.log('Retry login response status:', retryLoginResponse.status);
    }
    
    // Try to create a payment transaction
    console.log('\nStep 2: Attempting to create payment transaction...');
    
    // Get cookies from previous login to use in payment request
    const paymentResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/payment/create-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      }),
      credentials: 'include'  // This should include cookies
    });

    console.log('\nPayment response status:', paymentResponse.status);
    console.log('Payment response headers:', [...paymentResponse.headers.entries()]);
    
    const paymentText = await paymentResponse.text();
    console.log('Payment response body:', paymentText);
    
  } catch (error) {
    console.error('❌ Error during payment transaction test:', error.message);
  }
};

testPaymentTransaction();