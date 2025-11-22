const testAPIStatus = async () => {
  // Test endpoints to check API availability
  const endpoints = [
    'https://catering.hijrah-attauhid.or.id/api/test',
    'https://catering.hijrah-attauhid.or.id/api',
    'https://catering.hijrah-attauhid.or.id/'
  ];

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    console.log(`\nTesting endpoint: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('\nResponse Status:', response.status);
      console.log('Response Headers:', [...response.headers.entries()]);
      
      // Baca response text
      const responseText = await response.text();
      console.log('Response Text:', responseText ? responseText : '(empty)');
      
      if (responseText && responseText.trim()) {
        try {
          const data = JSON.parse(responseText);
          console.log('Parsed JSON Response Body:', data);
        } catch (parseError) {
          console.log('\n⚠️  Response is not valid JSON');
        }
      }
      
    } catch (error) {
      console.error('❌ Error testing endpoint', endpoint, ':', error.message);
    }
  }
};

// Also test the login endpoint with GET to see if it responds differently
const testGETLogin = async () => {
  console.log('\n\nTesting GET request to login endpoint to see allowed methods:');
  
  try {
    const response = await fetch('https://catering.hijrah-attauhid.or.id/api/login', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('\nResponse Status (GET /api/login):', response.status);
    console.log('Response Headers:', [...response.headers.entries()]);
    
    const responseText = await response.text();
    console.log('Response Text:', responseText ? responseText : '(empty)');
    
  } catch (error) {
    console.error('❌ Error testing GET /api/login:', error.message);
  }
};

// Run the tests
testAPIStatus();
testGETLogin();