const testPaymentDebug = async () => {
  console.log('Testing Midtrans configuration and payment creation...');
  
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
  
  // Check Midtrans configuration
  console.log('\nStep 2: Checking Midtrans configuration...');
  
  const configResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/payment/config', {
    headers: {
      'Cookie': cookies
    }
  });
  
  console.log('Midtrans config status:', configResponse.status);
  const configText = await configResponse.text();
  console.log('Midtrans config response:', configText);
  
  if (configResponse.ok) {
    try {
      const configData = JSON.parse(configText);
      console.log('Midtrans client key available:', !!configData.clientKey);
    } catch (e) {
      console.log('Could not parse config response:', e.message);
    }
  }
  
  // Now try to create an order again
  console.log('\nStep 3: Creating an order again...');
  
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
        specialInstructions: 'Test order for payment debug'
      })
    });
    
    console.log('Order creation status:', orderResponse.status);
    const orderText = await orderResponse.text();
    console.log('Order creation response:', orderText);
    
    if (orderResponse.ok) {
      let orderId = null;
      try {
        const orderData = JSON.parse(orderText);
        if (orderData.id) {
          orderId = orderData.id;
        } else if (orderData.order && orderData.order.id) {
          orderId = orderData.order.id;
        }
      } catch (e) {
        console.log('Error parsing order response:', e.message);
      }
      
      if (orderId) {
        console.log('Created order ID:', orderId);
        
        // Before creating payment, let's try to retrieve the order
        console.log('\nStep 4: Verifying the order exists...');
        const verifyResponse = await fetch(`https://catering.hijrah-attauhid.or.id/api/order/${orderId}`, {
          headers: {
            'Cookie': cookies
          }
        });
        
        console.log('Order verification status:', verifyResponse.status);
        if (verifyResponse.status !== 200) {
          const verifyText = await verifyResponse.text();
          console.log('Order verification response:', verifyText);
        } else {
          console.log('Order verification successful');
        }
        
        // Now try to create payment
        console.log('\nStep 5: Creating payment transaction...');
        
        const paymentResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/payment/create-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
          },
          body: JSON.stringify({
            orderId: orderId,
            amount: menuPrice, // Use the actual menu price
            customerDetails: {
              firstName: 'Test',
              lastName: 'Customer',
              email: 'test@example.com',
              phone: '+6281234567890'
            }
          })
        });

        console.log('\nPayment response status:', paymentResponse.status);
        const paymentText = await paymentResponse.text();
        console.log('Payment response body:', paymentText);
        
        if (paymentResponse.status === 500) {
          console.log('\n🔴 Payment failed with 500 error - likely a Midtrans configuration issue');
          console.log('This could be due to:');
          console.log('1. Invalid Midtrans keys in server configuration');
          console.log('2. Network connectivity issue between server and Midtrans');
          console.log('3. Invalid order data format for Midtrans API');
        }
      } else {
        console.log('Could not extract order ID from response');
      }
    } else {
      console.log('Failed to create order');
    }
  } else {
    console.log('Could not get menu ID or available date');
  }
};

testPaymentDebug();