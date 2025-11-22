const testPaymentFlowComplete = async () => {
  console.log('=== Testing Complete Payment Flow ===\n');
  
  let cookies = '';
  
  // Login first
  console.log('1. Logging in...');
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
    console.log('✓ Login successful');
  } else {
    console.log('✗ Login failed');
    return;
  }
  
  // Get available date
  const datesResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/available-dates', {
    headers: {
      'Cookie': cookies
    }
  });
  
  let availableDate = null;
  if (datesResponse.ok) {
    try {
      const datesData = JSON.parse(await datesResponse.text());
      if (datesData.dates && Array.isArray(datesData.dates)) {
        availableDate = datesData.dates[0];
      }
    } catch (e) {
      console.log('Error parsing available dates:', e.message);
    }
  }
  
  // Get menu item
  const menuResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/menu', {
    headers: {
      'Cookie': cookies
    }
  });
  
  let menuId = null;
  if (menuResponse.ok) {
    try {
      const menuText = await menuResponse.text();
      const menuData = JSON.parse(menuText);
      let menuItems = [];
      
      if (menuData.menuItems && Array.isArray(menuData.menuItems)) {
        menuItems = menuData.menuItems;
      } else if (Array.isArray(menuData)) {
        menuItems = menuData;
      }
      
      if (menuItems.length > 0) {
        menuId = menuItems[0].id;
      }
    } catch (e) {
      console.log('Error parsing menu:', e.message);
    }
  }
  
  if (menuId && availableDate) {
    // Create an order
    console.log('\n2. Creating order...');
    const orderResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        menuId: menuId,
        quantity: 1,
        orderDate: availableDate,
        specialInstructions: 'Test order for complete flow'
      })
    });
    
    if (orderResponse.ok) {
      let orderId = null;
      try {
        const orderData = JSON.parse(await orderResponse.text());
        if (orderData.order && orderData.order.id) {
          orderId = orderData.order.id;
        }
      } catch (e) {
        console.log('Error parsing order response:', e.message);
      }
      
      if (orderId) {
        console.log(`✓ Created order ID: ${orderId}`);
        
        // Create payment transaction
        console.log('\n3. Creating payment transaction...');
        const paymentResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/payment/create-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
          },
          body: JSON.stringify({
            orderId: orderId,
            amount: 10000, // 10,000 IDR
            customerDetails: {
              firstName: 'Test',
              lastName: 'Customer',
              email: 'test@example.com',
              phone: '+6281234567890'
            }
          })
        });

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          console.log('✓ Payment created successfully');
          console.log(`Payment Token: ${paymentData.token}`);
          console.log(`Redirect URL: ${paymentData.redirectUrl}`);
          console.log(`Transaction ID: ${paymentData.transactionId}`);
          
          // Check initial status (should be 'pending')
          console.log('\n4. Checking initial payment status...');
          const initialStatusResponse = await fetch(`https://catering.hijrah-attauhid.or.id/api/payment/status/${orderId}`, {
            headers: {
              'Cookie': cookies
            }
          });
          
          const initialStatus = await initialStatusResponse.json();
          console.log(`✓ Initial status: ${initialStatus.paymentStatus}`);
          
          // Now simulate completing payment by calling the status endpoint again
          // This will fetch latest status from Midtrans (but since it's sandbox, 
          // we can't actually complete it, so let's just verify the status endpoint works)
          console.log('\n5. Checking status again (would update if payment completed)...');
          const updatedStatusResponse = await fetch(`https://catering.hijrah-attauhid.or.id/api/payment/status/${orderId}`, {
            headers: {
              'Cookie': cookies
            }
          });
          
          const updatedStatus = await updatedStatusResponse.json();
          console.log(`✓ Updated status: ${updatedStatus.paymentStatus}`);
          
          // Also check order history to see if paymentId is now populated
          console.log('\n6. Checking order history for payment details...');
          const historyResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/history', {
            headers: {
              'Cookie': cookies
            }
          });
          
          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            const targetOrder = historyData.orders.find(order => order.id === orderId);
            
            if (targetOrder) {
              console.log('✓ Order details from history:');
              console.log('  - ID:', targetOrder.id);
              console.log('  - Status:', targetOrder.status);
              console.log('  - Payment Status:', targetOrder.paymentStatus);
              console.log('  - Payment ID:', targetOrder.paymentId);
              console.log('  - Payment Token:', targetOrder.paymentToken);
            }
          }
          
          console.log('\n7. To simulate completed payment:');
          console.log('   - Visit:', paymentData.redirectUrl);
          console.log('   - Complete the payment using Midtrans sandbox (test credit card: 4811 1111 1111 1114)');
          console.log('   - After payment, the status should update automatically via webhook');
          console.log('   - Or call /api/payment/status/{orderId} endpoint to refresh status');
        } else {
          console.log('✗ Payment creation failed:', await paymentResponse.text());
        }
      }
    } else {
      console.log('✗ Order creation failed:', await orderResponse.text());
    }
  } else {
    console.log('✗ Could not get menu ID or available date');
  }
};

testPaymentFlowComplete();