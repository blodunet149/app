const checkOrderAndPayment = async () => {
  console.log('Checking if order exists and testing payment process...');
  
  let cookies = '';
  
  // First, login to get cookies
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
  
  // Check if order exists
  console.log('\nStep 2: Checking if order #1 exists...');
  
  const orderResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/1', {
    headers: {
      'Cookie': cookies
    }
  });
  
  console.log('Order #1 response status:', orderResponse.status);
  const orderText = await orderResponse.text();
  console.log('Order #1 response:', orderText);
  
  if (orderResponse.status === 404 || orderResponse.status === 403) {
    console.log('\nOrder #1 does not exist or unauthorized. Let\'s try to create an order first.');
    
    // Create a test order
    console.log('\nStep 3: Creating a test order...');
    const menuResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/menu', {
      headers: {
        'Cookie': cookies
      }
    });
    
    const menuText = await menuResponse.text();
    console.log('Menu response status:', menuResponse.status);
    
    if (menuResponse.ok) {
      try {
        const menuData = JSON.parse(menuText);
        console.log('Menu items found:', Array.isArray(menuData) ? menuData.length : 'Not an array');
        
        if (Array.isArray(menuData) && menuData.length > 0) {
          const firstMenu = menuData[0];
          console.log('Using first menu item:', firstMenu);
          
          // Create an order
          const orderCreateResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': cookies
            },
            body: JSON.stringify({
              menuId: firstMenu.id,
              quantity: 1,
              orderDate: new Date().toISOString().split('T')[0], // Today's date
              specialInstructions: 'Test order for payment'
            })
          });
          
          console.log('Order creation status:', orderCreateResponse.status);
          const orderCreateText = await orderCreateResponse.text();
          console.log('Order creation response:', orderCreateText);
          
          if (orderCreateResponse.ok) {
            const createdOrder = JSON.parse(orderCreateText);
            const newOrderId = createdOrder.id;
            console.log('Created new order with ID:', newOrderId);
            
            // Now try to create payment for the new order
            console.log('\nStep 4: Creating payment for new order...');
            const paymentResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/payment/create-transaction', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies
              },
              body: JSON.stringify({
                orderId: newOrderId,
                amount: 50000,  // 50,000 IDR
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
          }
        } else {
          console.log('No menu items available to create an order');
        }
      } catch (e) {
        console.log('Error parsing menu response:', e.message);
      }
    } else {
      console.log('Could not fetch menu to create an order');
    }
  } else if (orderResponse.ok) {
    // Order exists, try payment with it
    console.log('\nStep 3: Order exists, trying payment with it...');
    
    const paymentResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/payment/create-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        orderId: 1,
        amount: 50000,  // 50,000 IDR
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
  }
};

checkOrderAndPayment();