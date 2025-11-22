const testLocalLogin = async () => {
  console.log('Testing local login with credentials:');
  console.log('Email: user@user.com');
  console.log('Password: user@user.com');
  
  try {
    const response = await fetch('http://127.0.0.1:8787/api/login', {
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
    
    const responseText = await response.text();
    console.log('Response Text:', responseText ? responseText : '(empty)');
    
    if (responseText && responseText.trim()) {
      try {
        const data = JSON.parse(responseText);
        console.log('Parsed JSON Response Body:', data);
        
        if (response.ok && data.success) {
          console.log('\n✅ Login SUCCESSFUL on local server');
          console.log('User Info:', data.user);
        } else {
          console.log('\n❌ Login FAILED on local server');
          console.log('Error:', data.error || 'Unknown error occurred');
        }
      } catch (parseError) {
        console.log('\n⚠️  Response is not valid JSON');
      }
    }
    
  } catch (error) {
    console.error('❌ Error during local login test:', error.message);
  }
};

// Run the test
testLocalLogin();