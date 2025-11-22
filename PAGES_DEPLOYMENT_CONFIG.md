# Cloudflare Pages Configuration for Catering App

## Build Configuration

### Build Settings
- Framework Preset: None (Custom)
- Build Command: `npm run build:client`
- Build Output Directory: `dist`
- Root Directory: `.` (root)

### Environment Variables
If needed for build:
- NODE_VERSION: 18 (or latest LTS)

## Routes Configuration

The `_routes.json` in the root directory tells Cloudflare Workers which routes to handle:

```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

This means:
- `/api/*` routes are handled by Cloudflare Workers (backend)
- All other routes are served by Pages (frontend)
- This configuration ensures frontend handles all non-API routes

## Deployment Notes

1. This configuration enables the frontend to handle client-side routing for admin pages
2. The React Router will handle routes like `/admin/dashboard`, `/admin/reports/*` etc.
3. API routes are proxied to the Workers backend
4. The frontend build includes all the admin page components

## Troubleshooting

If admin pages don't appear:
1. Check that Cloudflare Pages has completed the latest deployment
2. Verify that the build completed without errors
3. Clear browser cache after deployment
4. Make sure user has admin role to see admin pages

## File Structure Deployed

The following files will be deployed to Cloudflare Pages:
- All files in `dist/` directory
- These include React app with admin dashboard components
- Assets are handled correctly
- Client-side routing works for SPA