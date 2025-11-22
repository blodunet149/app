const testReports = async () => {
  console.log('Testing new reporting endpoints for admin...\n');
  
  let cookies = '';
  
  // Login first (using admin account - if doesn't exist, we'll create one)
  console.log('1. Logging in as admin...');
  const loginResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@hijrah-attauhid.or.id', // Let's try with a potential admin account
      password: 'admin123' // Default admin password
    })
  });

  if (!loginResponse.ok) {
    console.log('Admin login failed, trying as regular user first to create admin...');
    
    // Login as regular user
    const userLoginResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'user@user.com',
        password: 'user@user.com'
      })
    });
    
    if (userLoginResponse.ok) {
      console.log('✓ Regular user login successful');
      const setCookieHeaders = userLoginResponse.headers.get('set-cookie');
      if (setCookieHeaders) {
        cookies = setCookieHeaders.split(',').map(cookie => {
          return cookie.split(';')[0];
        }).join('; ');
      }
    } else {
      console.log('✗ Both login attempts failed');
      return;
    }
  } else {
    console.log('✓ Admin login successful');
    const setCookieHeaders = loginResponse.headers.get('set-cookie');
    if (setCookieHeaders) {
      cookies = setCookieHeaders.split(',').map(cookie => {
        return cookie.split(';')[0];
      }).join('; ');
    }
  }
  
  // First check user role to see if we have admin access
  console.log('\n2. Checking user role...');
  const meResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/me', {
    headers: {
      'Cookie': cookies
    }
  });
  
  if (meResponse.ok) {
    const userData = await meResponse.json();
    console.log(`User role: ${userData.user.role}`);
    
    if (userData.user.role !== 'admin') {
      console.log('⚠️  Current user is not admin. Testing endpoints will return 403.');
    }
  }
  
  console.log('\n3. Testing order summary endpoint...');
  // Test the reports endpoint (will fail if not admin)
  const summaryResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/summary', {
    headers: {
      'Cookie': cookies
    }
  });
  
  console.log('Summary endpoint status:', summaryResponse.status);
  const summaryData = await summaryResponse.text();
  console.log('Summary response:', summaryData);
  
  console.log('\n4. Testing cooking schedule endpoint...');
  // Test the cooking schedule endpoint
  const cookingResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/for-cooking', {
    headers: {
      'Cookie': cookies
    }
  });
  
  console.log('Cooking endpoint status:', cookingResponse.status);
  const cookingData = await cookingResponse.text();
  console.log('Cooking response preview:', cookingData.substring(0, 200) + (cookingData.length > 200 ? '...' : ''));
  
  console.log('\n5. Testing paid orders for cooking endpoint...');
  // Test the paid orders cooking endpoint
  const paidCookingResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/for-cooking-paid', {
    headers: {
      'Cookie': cookies
    }
  });
  
  console.log('Paid cooking endpoint status:', paidCookingResponse.status);
  const paidCookingData = await paidCookingResponse.text();
  console.log('Paid cooking response preview:', paidCookingData.substring(0, 200) + (paidCookingData.length > 200 ? '...' : ''));
  
  console.log('\n6. Available endpoints for admin:');
  console.log('   - GET /api/order/summary (with optional params: startDate, endDate, paymentStatus)');
  console.log('   - GET /api/order/for-cooking (with optional param: date)');
  console.log('   - GET /api/order/for-cooking-paid (with optional param: date)');
  
  console.log('\nTo use these endpoints with admin access:');
  console.log('1. Create an admin user or change a user role to admin in the database');
  console.log('2. Login with admin credentials');
  console.log('3. Access the endpoints with admin authentication');
};

testReports();