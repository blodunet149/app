// Konfigurasi Midtrans client untuk debugging
const testMidtransResponse = async () => {
  console.log('Mencoba membuat transaksi untuk melihat struktur response Midtrans...');
  
  let cookies = '';
  
  // Login
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
  } else {
    console.log('Login gagal');
    return;
  }
  
  // Buat order untuk testing
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
      console.log('Error parsing dates:', e.message);
    }
  }
  
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
    // Buat order
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
        specialInstructions: 'Test order for transaction debugging'
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
        console.log('Order berhasil dibuat dengan ID:', orderId);
        
        // Sekarang coba buat pembayaran
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

        console.log('Payment creation response status:', paymentResponse.status);
        const paymentText = await paymentResponse.text();
        console.log('Payment response:', paymentText);
        
        // Cek status pembayaran sekarang
        if (paymentResponse.ok) {
          console.log('\nMemeriksa status pembayaran sekarang...');
          const statusResponse = await fetch(`https://catering.hijrah-attauhid.or.id/api/payment/status/${orderId}`, {
            headers: {
              'Cookie': cookies
            }
          });
          
          console.log('Status response status:', statusResponse.status);
          const statusText = await statusResponse.text();
          console.log('Status response:', statusText);
          
          // Cek order history untuk membandingkan
          console.log('\nMemeriksa order history...');
          const historyResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/history', {
            headers: {
              'Cookie': cookies
            }
          });
          
          if (historyResponse.ok) {
            const historyText = await historyResponse.text();
            try {
              const historyData = JSON.parse(historyText);
              if (Array.isArray(historyData.orders)) {
                const targetOrder = historyData.orders.find(order => order.id === orderId);
                if (targetOrder) {
                  console.log('Data order dari history:', {
                    id: targetOrder.id,
                    paymentStatus: targetOrder.paymentStatus,
                    paymentId: targetOrder.paymentId,
                    paymentToken: targetOrder.paymentToken,
                    paymentUrl: targetOrder.paymentUrl
                  });
                }
              }
            } catch (e) {
              console.log('Error parsing history for comparison:', e.message);
            }
          }
        }
      }
    }
  }
};

testMidtransResponse();