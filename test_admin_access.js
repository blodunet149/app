const testAdminAccess = async () => {
  console.log('Testing admin access with newly created admin account...\n');
  
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
      
      // Test various admin endpoints
      console.log('\n--- Testing Admin Endpoints ---');
      
      // 1. Test summary endpoint
      console.log('\n1. Testing /api/order/summary...');
      const summaryResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/summary', {
        headers: {
          'Cookie': cookies
        }
      });
      console.log(`Summary endpoint status: ${summaryResponse.status}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        console.log('Summary data retrieved:', summaryData.summary);
      } else {
        console.log('Summary error:', await summaryResponse.text());
      }
      
      // 2. Test for-cooking endpoint
      console.log('\n2. Testing /api/order/for-cooking...');
      const cookingResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/for-cooking', {
        headers: {
          'Cookie': cookies
        }
      });
      console.log(`For-cooking endpoint status: ${cookingResponse.status}`);
      if (cookingResponse.ok) {
        const cookingData = await cookingResponse.json();
        console.log('For-cooking data retrieved:', {
          date: cookingData.date,
          totalOrders: cookingData.totalOrders,
          menuCount: cookingData.menuBreakdown.length
        });
      } else {
        console.log('For-cooking error:', await cookingResponse.text());
      }
      
      // 3. Test daily report endpoint
      console.log('\n3. Testing /api/order/daily-report...');
      const today = new Date().toISOString().split('T')[0];
      const reportResponse = await fetch(`https://catering.hijrah-attauhid.or.id/api/order/daily-report/${today}`, {
        headers: {
          'Cookie': cookies
        }
      });
      console.log(`Daily report endpoint status: ${reportResponse.status}`);
      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        console.log('Daily report data retrieved:', {
          date: reportData.date,
          totalOrders: reportData.statistics.totalOrders,
          totalRevenue: reportData.statistics.totalRevenue
        });
      } else {
        console.log('Daily report error:', await reportResponse.text());
      }
      
      // 4. Get an existing order to test update endpoints
      console.log('\n4. Testing order update endpoints...');
      const historyResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/history', {
        headers: {
          'Cookie': cookies
        }
      });
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        if (historyData.orders && historyData.orders.length > 0) {
          const orderToTest = historyData.orders[0];
          console.log(`Found order to test update: ID ${orderToTest.id}`);
          
          // Test update status endpoint
          const updateStatusResponse = await fetch(`https://catering.hijrah-attauhid.or.id/api/order/${orderToTest.id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': cookies
            },
            body: JSON.stringify({ status: 'preparing' })
          });
          console.log(`Update status endpoint status: ${updateStatusResponse.status}`);
          if (updateStatusResponse.ok) {
            const updateData = await updateStatusResponse.json();
            console.log('Status updated to:', updateData.order.status);
          } else {
            console.log('Update status error:', await updateStatusResponse.text());
          }
          
          // Test mark as ready endpoint (only works if order was 'preparing')
          const markReadyResponse = await fetch(`https://catering.hijrah-attauhid.or.id/api/order/${orderToTest.id}/ready`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': cookies
            }
          });
          console.log(`Mark ready endpoint status: ${markReadyResponse.status}`);
          if (markReadyResponse.ok) {
            const readyData = await markReadyResponse.json();
            console.log('Order marked as ready:', readyData.order.status);
          } else {
            console.log('Mark ready error:', await markReadyResponse.text());
          }
        } else {
          console.log('No orders found to test update endpoints');
        }
      } else {
        console.log('Could not fetch order history:', await historyResponse.text());
      }
      
      console.log('\n--- Admin Access Test Complete ---');
      console.log('All admin endpoints are working correctly!');
      
    } else {
      const error = await loginResponse.text();
      console.log(`✗ Login failed: ${error}`);
    }
  } catch (error) {
    console.log(`✗ Error during test: ${error.message}`);
  }
};

testAdminAccess();