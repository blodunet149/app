const testLogin = async () => {
  // Daftar endpoint yang akan dicoba
  const endpoints = [
    'https://catering.hijrah-attauhid.or.id/api/login',
    'https://app.catering.hijrah-attauhid.or.id/api/login',
    'https://api.catering.hijrah-attauhid.or.id/api/login'
  ];

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    console.log(`\nTesting login with credentials on: ${endpoint}`);
    console.log('Email: user@user.com');
    console.log('Password: user@user.com');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'user@user.com',
          password: 'user@user.com'
        })
      });

      console.log('\nResponse Status:', response.status);
      console.log('Response Headers:', [...response.headers.entries()]);

      // Baca response text
      const responseText = await response.text();
      console.log('Response Text:', responseText);

      if (responseText && responseText.trim()) {
        try {
          const data = JSON.parse(responseText);
          console.log('Parsed JSON Response Body:', data);

          if (response.ok && data.success) {
            console.log('\n✅ Login SUCCESSFUL on', endpoint);
            console.log('User Info:', data.user);
            return; // Exit if successful
          } else {
            console.log('\n❌ Login FAILED on', endpoint);
            console.log('Error:', data.error || 'Unknown error occurred');
          }
        } catch (parseError) {
          console.log('\n⚠️  Response is not valid JSON on', endpoint);
        }
      } else {
        console.log('\n⚠️  Empty response body on', endpoint);
      }

    } catch (error) {
      console.error('❌ Error during login test on', endpoint, ':', error.message);
    }
  }

  console.log('\n🔍 All endpoints tested - no successful login found');
};

// Run the test
testLogin();