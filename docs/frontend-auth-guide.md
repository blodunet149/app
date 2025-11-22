# Frontend Authentication Guide

## Using Credentials with API Calls

To ensure the JWT cookies (access_token, refresh_token) are sent with API requests, you must configure your frontend to include credentials in all requests to your custom domain.

### JavaScript/Fetch Example:

```javascript
// When making API calls to your domain
fetch('https://catering.hijrah-attauhid.or.id/api/menu', {
  method: 'GET',
  credentials: 'include',  // This is crucial for sending cookies
  headers: {
    'Content-Type': 'application/json',
  },
})
.then(response => response.json())
.then(data => console.log(data));
```

### Using Axios:

```javascript
// Configure axios to always include credentials
axios.defaults.withCredentials = true;

// Or per request
axios.get('https://catering.hijrah-attauhid.or.id/api/menu', {
  withCredentials: true  // This ensures cookies are sent
});
```

### React with fetch (example in your auth hook):

```javascript
// In useAuth.ts or similar
const getMenu = async () => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/menu`, {
      method: 'GET',
      credentials: 'include',  // Very important!
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else if (response.status === 401) {
      // Handle unauthorized access (redirect to login)
      handleLogout();
    }
  } catch (error) {
    console.error('Error fetching menu:', error);
  }
};
```

## Protected Endpoints

The following endpoints now require authentication and proper credential configuration:

- `/api/menu` (all methods)
- `/api/menu/available`
- `/api/order` (all methods)
- `/api/order/history`
- `/api/order/all` (admin only)
- `/api/order/:id/status` (admin only)

## Error Handling

If your API calls return 401 Unauthorized, verify:
1. Cookies are being set properly (check browser developer tools)
2. `credentials: 'include'` is configured
3. You're logged in (have valid JWT tokens)

## Domain Configuration

Make sure your frontend is configured to use the custom domain:
- Backend: `https://catering.hijrah-attauhid.or.id`
- Cookies will automatically be sent to this domain