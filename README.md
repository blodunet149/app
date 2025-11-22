# Catering App

Full-stack catering application with Cloudflare Workers backend and React frontend.

## Project Structure

- `src/` - Main React application source
- `pages/` - React page components
- `components/` - React UI components
- `api/` - Backend API endpoints
- `functions/` - Cloudflare Workers functions

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