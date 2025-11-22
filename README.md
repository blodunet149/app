# Catering App

Full-stack catering application with Cloudflare Workers backend and React frontend.

## Project Structure

- `src/` - Main React application source
- `pages/` - React page components
- `components/` - React UI components
- `api/` - Backend API endpoints
- `functions/` - Cloudflare Workers functions

## Features

### Admin Features
- **Dashboard** - Overview statistics
- **Order Summary** - Detailed order reports with filtering by date and payment status
- **Cooking Schedule** - Kitchen planning tool for daily cooking schedules
- **Daily Report** - Daily operational report
- **Order Management** - View and update all orders
- **Menu Management** - Manage catering menu items

### Kitchen Features
The application includes specialized features for kitchen staff:
- **Cooking Schedule Page** (`/admin/reports/cooking-schedule`) - Displays orders that need to be prepared for a specific date
- **Filter Options** - View all orders or only paid orders
- **Order Grouping** - Orders grouped by menu items for efficient kitchen planning
- **API Endpoints**:
  - `/api/order/for-cooking` - Get all orders to be prepared for a date
  - `/api/order/for-cooking-paid` - Get only paid orders to be prepared

## CSS Styling

All styling is handled through the `src/index.css` file. The CSS is bundled during the build process and loaded automatically in the application.

## Troubleshooting CSS Issues

If you experience CSS not loading in deployment (plain/without styling):

1. Make sure all CSS classes used in components are defined in `src/index.css`
2. Check that the Vite config uses relative paths (`base: './'`)
3. After making CSS changes, rebuild the client:
   ```bash
   npm run build:client
   ```
4. Clear browser cache or try hard refresh (Ctrl+Shift+R)

## Troubleshooting Kitchen Features

If kitchen features are not showing up in admin menu:

1. Make sure you're logged in as admin user
2. Check that the "Cooking Schedule" menu item is visible in the sidebar
3. The kitchen features are located under "Cooking Schedule" and not "Order Summary"