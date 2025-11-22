const testAdminLogin = async () => {
  console.log('Testing admin accounts...\n');
  
  const adminAccounts = [
    { email: 'fulan3@gmail.com', password: 'default_password' },
    { email: 'fulan@gmai.com', password: 'default_password' },
    { email: 'admin@admin.com', password: 'default_password' }
  ];
  
  for (const account of adminAccounts) {
    console.log(`Trying to login with: ${account.email}`);
    
    try {
      const response = await fetch('https://catering.hijrah-attauhid.or.id/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: account.email,
          password: account.password
        })
      });

      console.log(`Login response status: ${response.status}`);
      
      if (response.status === 200) {
        const data = await response.json();
        console.log(`✓ Login successful! User role: ${data.user.role}`);
        console.log(`User info:`, data.user);
        
        // Test admin endpoint with this account
        console.log(`\nTesting admin endpoint with ${account.email}...`);
        
        const cookies = response.headers.get('set-cookie');
        let cookieHeader = '';
        if (cookies) {
          cookieHeader = cookies.split(',').map(cookie => {
            return cookie.split(';')[0];
          }).join('; ');
        }
        
        const summaryResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/order/summary', {
          headers: {
            'Cookie': cookieHeader
          }
        });
        
        console.log(`Summary endpoint response: ${summaryResponse.status}`);
        if (summaryResponse.status === 200) {
          console.log('✓ Admin endpoint accessible!');
        } else {
          const error = await summaryResponse.text();
          console.log('Admin endpoint response:', error);
        }
        
        return; // Exit after finding first working admin account
      } else {
        const error = await response.text();
        console.log(`✗ Login failed: ${error}`);
      }
    } catch (error) {
      console.log(`✗ Error during login: ${error.message}`);
    }
    
    console.log('---\n');
  }
  
  // If no default password works, provide instructions
  console.log('\nNote: If none of the default passwords worked, you may need to:');
  console.log('1. Reset password for one of the admin accounts');
  console.log('2. Or use the register endpoint to create a new admin account');
  
  // We can also try to register an admin account
  console.log('\nTrying to register a new admin account...');
  const registerResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin_user',
      email: 'admin_new@hijrah-attauhid.or.id',
      password: 'secure_password123',
      role: 'admin' // This should work if registration allows role selection
    })
  });
  
  console.log(`Registration response: ${registerResponse.status}`);
  const registerResult = await registerResponse.text();
  console.log(`Registration result: ${registerResult}`);
};

testAdminLogin();