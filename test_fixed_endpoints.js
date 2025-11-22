const testFixedEndpoints = async () => {
  console.log('Testing fixed admin endpoints...\n');
  
  const adminEmail = 'admin_new@hijrah-attauhid.or.id';
  const adminPassword = 'secure_password123';
  
  console.log(`Logging in with: ${adminEmail}`);
  
  try {
    // Login first
    const loginResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword
      })
    });

    console.log(`Login status: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log(`✓ Login successful! User role: ${loginData.user.role}`);
      
      // Extract cookies for subsequent requests
      const setCookieHeaders = loginResponse.headers.get('set-cookie');
      let cookies = '';
      if (setCookieHeaders) {
        cookies = setCookieHeaders.split(',').map(cookie => {
          return cookie.split(';')[0];
        }).join('; ');
      }
      
      // Test the previously failing endpoint
      console.log('\n--- Testing Previously Failing Endpoint ---');
      
      // Test for-cooking endpoint
      console.log('\nTesting /api/order/for-cooking...');
      const cookingResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/for-cooking', {
        headers: {
          'Cookie': cookies
        }
      });
      console.log(`For-cooking endpoint status: ${cookingResponse.status}`);
      if (cookingResponse.ok) {
        const cookingData = await cookingResponse.json();
        console.log('For-cooking data retrieved successfully:', {
          date: cookingData.date,
          totalOrders: cookingData.totalOrders,
          menuCount: cookingData.menuBreakdown.length
        });
      } else {
        console.log('For-cooking error:', await cookingResponse.text());
      }
      
      // Test for-cooking-paid endpoint
      console.log('\nTesting /api/order/for-cooking-paid...');
      const paidCookingResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/for-cooking-paid', {
        headers: {
          'Cookie': cookies
        }
      });
      console.log(`For-cooking-paid endpoint status: ${paidCookingResponse.status}`);
      if (paidCookingResponse.ok) {
        const paidCookingData = await paidCookingResponse.json();
        console.log('For-cooking-paid data retrieved successfully:', {
          date: paidCookingData.date,
          totalOrders: paidCookingData.totalOrders,
          menuCount: paidCookingData.menuBreakdown.length
        });
      } else {
        console.log('For-cooking-paid error:', await paidCookingResponse.text());
      }
      
      // Test with a specific date
      console.log('\nTesting with today\'s date...');
      const today = new Date().toISOString().split('T')[0];
      
      const cookingTodayResponse = await fetch(`https://catering.hijrah-attauhid.or.id/api/order/for-cooking?date=${today}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      console.log(`For-cooking (today) endpoint status: ${cookingTodayResponse.status}`);
      if (cookingTodayResponse.ok) {
        const todayData = await cookingTodayResponse.json();
        console.log('Today\'s cooking schedule:', {
          date: todayData.date,
          totalOrders: todayData.totalOrders,
          menuCount: todayData.menuBreakdown.length
        });
      } else {
        console.log('Today\'s for-cooking error:', await cookingTodayResponse.text());
      }
      
      console.log('\n--- Test Complete ---');
      console.log('All endpoints should now be working correctly!');
      
    } else {
      const error = await loginResponse.text();
      console.log(`✗ Login failed: ${error}`);
    }
  } catch (error) {
    console.log(`✗ Error during test: ${error.message}`);
  }
};

testFixedEndpoints();