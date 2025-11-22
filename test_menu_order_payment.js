const checkMenuAndCreateOrder = async () => {
  console.log('Checking menu data and attempting to create a test order...');
  
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
  
  console.log('\nStep 2: Getting menu data...');
  
  // Try with a different path since /api/menu might not be correct
  const menuPaths = ['/api/menu', '/api/menu/'];
  
  for (const path of menuPaths) {
    console.log(`Trying menu path: ${path}`);
    const menuResponse = await fetch(`https://catering.hijrah-attauhid.or.id${path}`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    console.log(`Menu ${path} response status:`, menuResponse.status);
    const menuText = await menuResponse.text();
    console.log(`Menu ${path} response:`, menuText.substring(0, 200) + (menuText.length > 200 ? '...' : ''));
    
    if (menuResponse.ok) {
      try {
        const menuData = JSON.parse(menuText);
        if (Array.isArray(menuData) && menuData.length > 0) {
          console.log('Found', menuData.length, 'menu items');
          console.log('First menu item:', JSON.stringify(menuData[0], null, 2));
          
          // Create an order
          console.log('\nStep 3: Creating an order with first menu item...');
          
          const orderResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': cookies
            },
            body: JSON.stringify({
              menuId: menuData[0].id,
              quantity: 1,
              orderDate: new Date().toISOString().split('T')[0], // Today's date
              specialInstructions: 'Test order for payment'
            })
          });
          
          console.log('Order creation status:', orderResponse.status);
          const orderText = await orderResponse.text();
          console.log('Order creation response:', orderText);
          
          if (orderResponse.ok) {
            const createdOrder = JSON.parse(orderText);
            const orderId = createdOrder.id;
            console.log('Created order with ID:', orderId);
            
            // Now try to create payment for the order
            console.log('\nStep 4: Creating payment for the new order...');
            
            const paymentResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/payment/create-transaction', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies
              },
              body: JSON.stringify({
                orderId: orderId,
                amount: 50000,  // 50,000 IDR
                customerDetails: {
                  firstName: 'Test',
                  lastName: 'Customer',
                  email: 'test@example.com',
                  phone: '+6281234567890'
                }
              })
            });

            console.log('Payment response status:', paymentResponse.status);
            const paymentText = await paymentResponse.text();
            console.log('Payment response body:', paymentText);
            
            if (paymentResponse.status === 500) {
              console.log('\n🔍 Investigating the 500 error...');
              
              // Let's try to get the order to see its details
              console.log('\nStep 5: Checking the created order details...');
              const getOrderResponse = await fetch(`https://catering.hijrah-attauhid.or.id/api/order/${orderId}`, {
                headers: {
                  'Cookie': cookies
                }
              });
              
              console.log('Get order status:', getOrderResponse.status);
              const getOrderText = await getOrderResponse.text();
              console.log('Get order response:', getOrderText);
            }
          }
          return; // Exit after trying the first successful menu path
        }
      } catch (e) {
        console.log(`Menu response for ${path} is not valid JSON:`, e.message);
      }
    }
  }
  
  console.log('\nTrying to create a menu item first...');
  
  // If no menu items exist, create one first
  const createMenuResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/menu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({
      name: 'Test Menu',
      description: 'Test menu item for payment testing',
      price: 50000,
      photoUrl: 'https://example.com/test-menu.jpg'
    })
  });
  
  console.log('Menu creation response status:', createMenuResponse.status);
  const menuCreateText = await createMenuResponse.text();
  console.log('Menu creation response:', menuCreateText);
  
  if (createMenuResponse.ok) {
    try {
      const createdMenu = JSON.parse(menuCreateText);
      console.log('Created menu item:', createdMenu);
      
      // Now create order with the new menu
      console.log('\nCreating order with new menu item...');
      
      const orderWithNewMenuResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          menuId: createdMenu.id,
          quantity: 1,
          orderDate: new Date().toISOString().split('T')[0],
          specialInstructions: 'Test order for payment'
        })
      });
      
      console.log('Order creation with new menu status:', orderWithNewMenuResponse.status);
      const orderWithNewMenuText = await orderWithNewMenuResponse.text();
      console.log('Order creation response:', orderWithNewMenuText);
      
      if (orderWithNewMenuResponse.ok) {
        const newOrder = JSON.parse(orderWithNewMenuText);
        console.log('Created order:', newOrder);
        
        // Now try to create payment
        console.log('\nCreating payment for the new order...');
        
        const paymentResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/payment/create-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
          },
          body: JSON.stringify({
            orderId: newOrder.id,
            amount: 50000,
            customerDetails: {
              firstName: 'Test',
              lastName: 'Customer',
              email: 'test@example.com',
              phone: '+6281234567890'
            }
          })
        });

        console.log('Payment response status:', paymentResponse.status);
        const paymentText = await paymentResponse.text();
        console.log('Payment response body:', paymentText);
      }
    } catch (e) {
      console.log('Error creating order with new menu:', e.message);
    }
  }
};

checkMenuAndCreateOrder();