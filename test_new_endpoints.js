const testNewEndpoints = async () => {
  console.log('Testing new order management endpoints...\n');
  
  let cookies = '';
  
  // Login as regular user to test 403 responses for admin endpoints
  console.log('1. Logging in as regular user...');
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
    console.log('✓ User login successful');
    const setCookieHeaders = loginResponse.headers.get('set-cookie');
    if (setCookieHeaders) {
      cookies = setCookieHeaders.split(',').map(cookie => {
        return cookie.split(';')[0];
      }).join('; ');
    }
  } else {
    console.log('✗ Login failed');
    return;
  }
  
  // Check user role
  console.log('\n2. Checking user role...');
  const meResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/me', {
    headers: {
      'Cookie': cookies
    }
  });
  
  if (meResponse.ok) {
    const userData = await meResponse.json();
    console.log(`User role: ${userData.user.role}`);
  }
  
  console.log('\n3. Testing new endpoints (should return 403 for non-admin)...');
  
  // Test update order status endpoint
  const updateStatusResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/1/status', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({ status: 'preparing' })
  });
  
  console.log('Update status endpoint (403 expected):', updateStatusResponse.status);
  
  // Test mark as ready endpoint
  const markReadyResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/1/ready', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    }
  });
  
  console.log('Mark ready endpoint (403 expected):', markReadyResponse.status);
  
  // Test daily report endpoint
  const dailyReportResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/daily-report/2025-11-22', {
    headers: {
      'Cookie': cookies
    }
  });
  
  console.log('Daily report endpoint (403 expected):', dailyReportResponse.status);
  
  console.log('\n4. Summary of new admin endpoints:');
  console.log('   - PUT /api/order/:id/status - Update order status');
  console.log('   - PUT /api/order/:id/ready - Mark order as ready for delivery');
  console.log('   - GET /api/order/daily-report/:date - Get daily cooking report');
  console.log('   - GET /api/order/for-cooking - Kitchen schedule (all orders)');
  console.log('   - GET /api/order/for-cooking-paid - Kitchen schedule (paid orders only)');
  console.log('   - GET /api/order/summary - Order summary with filters');
  
  console.log('\n5. To use these endpoints with admin access:');
  console.log('   - Create admin user or change user role to admin');
  console.log('   - Login with admin credentials');
  console.log('   - Access endpoints with admin authentication');
};

testNewEndpoints();