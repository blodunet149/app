const testRegisterAndLogin = async () => {
  console.log('Step 1: Testing registration with credentials:');
  console.log('Email: user@user.com');
  console.log('Password: user@user.com');
  
  // First, try to register a user
  try {
    const registerResponse = await fetch('http://127.0.0.1:8787/api/register', {
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
    console.log('Registration Response Text:', registerText ? registerText : '(empty)');
    
    let registerData;
    try {
      registerData = JSON.parse(registerText);
      console.log('Parsed Registration Response Body:', registerData);
      
      if (registerResponse.ok && registerData.success) {
        console.log('\n✅ Registration SUCCESSFUL');
        console.log('Registered User Info:', registerData.user);
      } else {
        console.log('\n⚠️ Registration result:', registerData.error || 'Registration failed');
      }
    } catch (parseError) {
      console.log('\n⚠️  Registration response is not valid JSON');
    }
    
    // Now try to login
    console.log('\n\nStep 2: Trying to login with the same credentials:');
    
    const loginResponse = await fetch('http://127.0.0.1:8787/api/login', {
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
    console.log('Login Response Text:', loginText ? loginText : '(empty)');
    
    try {
      const loginData = JSON.parse(loginText);
      console.log('Parsed Login Response Body:', loginData);
      
      if (loginResponse.ok && loginData.success) {
        console.log('\n✅ Login SUCCESSFUL after registration');
        console.log('User Info:', loginData.user);
      } else {
        console.log('\n❌ Login FAILED');
        console.log('Error:', loginData.error || 'Unknown error occurred');
      }
    } catch (parseError) {
      console.log('\n⚠️  Login response is not valid JSON');
    }
    
  } catch (error) {
    console.error('❌ Error during register/login test:', error.message);
  }
};

// Run the test
testRegisterAndLogin();