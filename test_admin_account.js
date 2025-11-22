const testAdminAccount = async () => {
  console.log('🧪 Testing Admin Account: admin@admin.com\n');

  console.log('⚠️  WARNING: This test simulates what happens when you try to login');
  console.log('⚠️  In actual deployment, you would need to run this in a browser environment\n');

  console.log('Simulated login request:');
  console.log('  - Email: admin@admin.com');
  console.log('  - Password: admin@admin.com');
  console.log('  - Expected response: Server will check if user exists and has admin role\n');

  console.log('🔍 What happens during login process:');
  console.log('1. Server receives credentials');
  console.log('2. Server verifies if email exists in database');
  console.log('3. Server verifies password');
  console.log('4. Server checks user role in database');
  console.log('   - If role = "admin": access to admin features granted');
  console.log('   - If role = "user": access to admin features denied\n');

  console.log('📋 To test your account:');
  console.log('1. Open browser');
  console.log('2. Go to: https://catering.hijrah-attauhid.or.id/login');
  console.log('3. Enter:');
  console.log('   - Email: admin@admin.com');
  console.log('   - Password: admin@admin.com');
  console.log('4. After login, check if you can access:');
  console.log('   - /admin/dashboard');
  console.log('   - Sidebar menu should include "Cooking Schedule"');
  console.log('   - /admin/reports/cooking-schedule\n');

  console.log('✅ If you can access admin pages, then your account is admin');
  console.log('❌ If you get redirected or see 403 errors, then your account is not admin');

  console.log('\n💡 Note: Simply having "admin" in username does not make you admin.');
  console.log('    The user role must be explicitly set to "admin" in the database.');
};

testAdminAccount();