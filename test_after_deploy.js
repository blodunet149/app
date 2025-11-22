const testLoginAfterDeploy = async () => {
  console.log('Testing login on production after deploy with credentials:');
  console.log('Email: user@user.com');
  console.log('Password: user@user.com');
  
  try {
    // Using the production endpoint
    const response = await fetch('https://catering.hijrah-attauhid.or.id/api/login', {
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
    console.log('Response Text:', responseText ? responseText : '(empty)');
    
    if (responseText && responseText.trim()) {
      try {
        const data = JSON.parse(responseText);
        console.log('Parsed JSON Response Body:', data);
        
        if (response.ok && data.success) {
          console.log('\n✅ Login SUCCESSFUL on production!');
          console.log('User Info:', data.user);
        } else {
          console.log('\n❌ Login FAILED on production');
          console.log('Error:', data.error || 'Unknown error occurred');
          
          // Jika error karena kredensial tidak valid, coba register dulu
          if (data.error && data.error.includes('Invalid credentials')) {
            console.log('\nTrying to register the user first...');
            await registerAndLogin();
          }
        }
      } catch (parseError) {
        console.log('\n⚠️  Response is not valid JSON');
      }
    } else {
      console.log('\n⚠️  Empty response body on production');
    }
    
  } catch (error) {
    console.error('❌ Error during login test:', error.message);
  }
};

const registerAndLogin = async () => {
  console.log('\nStep 1: Registering user...');
  
  try {
    const registerResponse = await fetch('https://catering.hijrah-attauhid.or.id/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'user@user.com',
        password: 'user@user.com',
        role: 'user'
      })
    });

    console.log('\nRegistration Response Status:', registerResponse.status);
    const registerText = await registerResponse.text();
    console.log('Registration Response:', registerText);
    
    if (registerResponse.ok) {
      try {
        const registerData = JSON.parse(registerText);
        console.log('Registered User:', registerData.user);
        
        console.log('\nStep 2: Trying to login...');
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

        console.log('\nLogin Response Status:', loginResponse.status);
        const loginText = await loginResponse.text();
        console.log('Login Response:', loginText);
        
        try {
          const loginData = JSON.parse(loginText);
          if (loginResponse.ok && loginData.success) {
            console.log('\n✅ Login SUCCESSFUL after registration!');
            console.log('User Info:', loginData.user);
          } else {
            console.log('\n❌ Login still failed after registration');
            console.log('Error:', loginData.error || 'Unknown error');
          }
        } catch (parseError) {
          console.log('\n⚠️  Login response is not valid JSON');
        }
      } catch (parseError) {
        console.log('\n⚠️  Registration response is not valid JSON');
      }
    } else {
      console.log('\n❌ Registration failed');
    }
  } catch (error) {
    console.error('❌ Error during registration:', error.message);
  }
};

// Run the test
testLoginAfterDeploy();