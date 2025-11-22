const testAvailableDates = async () => {
  console.log('Testing available dates and complete payment flow...');
  
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
  
  console.log('\nStep 2: Getting available dates...');
  
  const datesResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/available-dates', {
    headers: {
      'Cookie': cookies
    }
  });
  
  console.log('Available dates response status:', datesResponse.status);
  const datesText = await datesResponse.text();
  console.log('Available dates response:', datesText);
  
  let availableDate = null;
  
  try {
    const datesData = JSON.parse(datesText);
    if (Array.isArray(datesData) && datesData.length > 0) {
      availableDate = datesData[0];
      console.log('First available date:', availableDate);
    } else if (datesData.dates && Array.isArray(datesData.dates)) {
      // The response format is {"dates": [...]}
      availableDate = datesData.dates[0];
      console.log('First available date from object:', availableDate);
    } else if (datesData.availableDates && Array.isArray(datesData.availableDates)) {
      availableDate = datesData.availableDates[0];
      console.log('First available date from object:', availableDate);
    } else {
      console.log('No available dates found in standard formats');
      // Use tomorrow as fallback
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      availableDate = tomorrow.toISOString().split('T')[0];
      console.log('Using tomorrow as fallback date:', availableDate);
    }
  } catch (e) {
    console.log('Error parsing dates response:', e.message);
    // Use tomorrow as fallback
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    availableDate = tomorrow.toISOString().split('T')[0];
    console.log('Using tomorrow as fallback date:', availableDate);
  }
  
  console.log('\nStep 3: Getting menu data...');
  
  const menuResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/menu', {
    headers: {
      'Cookie': cookies
    }
  });
  
  console.log('Menu response status:', menuResponse.status);
  
  let menuData = null;
  try {
    const menuText = await menuResponse.text();
    const parsedData = JSON.parse(menuText);
    
    if (parsedData.menuItems && Array.isArray(parsedData.menuItems)) {
      menuData = parsedData.menuItems;
    } else if (Array.isArray(parsedData)) {
      menuData = parsedData;
    }
  } catch (e) {
    console.log('Error parsing menu response:', e.message);
    return;
  }
  
  if (menuData && menuData.length > 0) {
    console.log('Found', menuData.length, 'menu items');
    const firstMenu = menuData[0];
    console.log('Using menu item ID:', firstMenu.id);
    
    // Create an order with the available date
    console.log('\nStep 4: Creating an order with available date...');
    
    const orderResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        menuId: firstMenu.id,
        quantity: 1,
        orderDate: availableDate, // Use available date instead of today
        specialInstructions: 'Test order for payment'
      })
    });
    
    console.log('Order creation status:', orderResponse.status);
    const orderText = await orderResponse.text();
    console.log('Order creation response:', orderText);
    
    if (orderResponse.ok) {
      let createdOrder = null;
      try {
        createdOrder = JSON.parse(orderText);
      } catch (e) {
        console.log('Order response is not valid JSON:', e.message);
        console.log('Full response:', orderText);
        return;
      }

      // The order ID might be at different levels depending on the API response
      let orderId = null;
      if (createdOrder.id) {
        orderId = createdOrder.id;
      } else if (createdOrder.order && createdOrder.order.id) {
        orderId = createdOrder.order.id;
      }

      console.log('Created order ID:', orderId);

      // Now try to create payment for the order
      console.log('\nStep 5: Creating payment for the new order...');

      const paymentResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/payment/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          orderId: orderId,
          amount: firstMenu.price || 50000, // Use menu price or default
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
        console.log('\n🔍 Investigating the 500 error...');
        
        // Check the created order
        console.log('\nStep 6: Checking the created order details...');
        const getOrderResponse = await fetch(`https://catering.hijrah-attauhid.or.id/api/order/${createdOrder.id}`, {
          headers: {
            'Cookie': cookies
          }
        });
        
        console.log('Get order status:', getOrderResponse.status);
        const getOrderText = await getOrderResponse.text();
        console.log('Get order response:', getOrderText);
      } else if (paymentResponse.ok) {
        console.log('\n✅ Payment creation was successful!');
        try {
          const paymentData = JSON.parse(paymentText);
          console.log('Payment details:', JSON.stringify(paymentData, null, 2));
        } catch (e) {
          console.log('Payment response is not valid JSON but status is OK');
        }
      }
    } else {
      console.log('Failed to create order with available date');
    }
  } else {
    console.log('No menu items found');
  }
};

testAvailableDates();