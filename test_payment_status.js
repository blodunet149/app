const testPaymentStatus = async () => {
  console.log('Testing payment status after transaction creation...');
  
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
  let menuPrice = 50000;
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
        menuPrice = menuItems[0].price;
        console.log('Using menu item ID:', menuId, 'Price:', menuPrice);
      }
    } catch (e) {
      console.log('Error parsing menu response:', e.message);
    }
  }
  
  if (menuId && availableDate) {
    // Create an order
    console.log('\nStep 2: Creating an order...');
    
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
        specialInstructions: 'Test order for payment status'
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
        console.log('Created order ID:', orderId);
        
        // Create payment transaction
        console.log('\nStep 3: Creating payment transaction...');
        
        const paymentResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/payment/create-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
          },
          body: JSON.stringify({
            orderId: orderId,
            amount: menuPrice,
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
          console.log('Payment created successfully');
          console.log('Payment token:', paymentData.token);
          console.log('Redirect URL:', paymentData.redirectUrl);
          
          // Immediately check payment status after creation
          console.log('\nStep 4: Checking payment status immediately after creation...');
          
          const statusResponse = await fetch(`https://catering.hijrah-attauhid.or.id/api/payment/status/${orderId}`, {
            headers: {
              'Cookie': cookies
            }
          });

          console.log('Status check response status:', statusResponse.status);
          const statusData = await statusResponse.json();
          console.log('Current payment status:', JSON.stringify(statusData, null, 2));
          
          console.log('\n🔄 To update payment status:');
          console.log('1. Complete payment at the redirect URL: ', paymentData.redirectUrl);
          console.log('2. Wait for Midtrans webhook to update status in database');
          console.log('3. Or call /api/payment/status/{orderId} endpoint again to refresh status from Midtrans');
        } else {
          console.log('Payment creation failed:', await paymentResponse.text());
        }
      }
    } else {
      console.log('Order creation failed:', await orderResponse.text());
    }
  }
};

testPaymentStatus();