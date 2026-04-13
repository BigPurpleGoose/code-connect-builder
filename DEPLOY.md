# Deployment Guide

This project can be deployed to GitHub Pages in two ways: manually or automatically via GitHub Actions.

## Prerequisites

- GitHub repository with the code
- `gh-pages` package already installed (check `package.json`)
- Vite base path configured correctly (already set to `/code-connect-builder/`)

## Method 1: Manual Deployment

### Quick Deploy

```bash
npm run deploy
```

Or use the provided script:

```bash
chmod +x deploy.sh  # Make executable (first time only)
./deploy.sh
```

This will:

1. Build the project (`npm run build`)
2. Deploy the `dist` folder to the `gh-pages` branch
3. Push to GitHub

Your site will be available at:

```
https://[your-username].github.io/code-connect-builder/
```

## Method 2: Automatic Deployment (GitHub Actions)

The GitHub Actions workflow is already configured in `.github/workflows/deploy.yml`.

### Setup

1. **Enable GitHub Pages:**
   - Go to your GitHub repository
   - Navigate to **Settings** → **Pages**
   - Under "Build and deployment":
     - **Source**: Select "GitHub Actions" (not "Deploy from a branch")

2. **Push to trigger deployment:**
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

### Automatic Deployment Triggers

The workflow automatically deploys when:

- Code is pushed to the `main` branch
- Manually triggered from the Actions tab (click "Run workflow")

### Monitor Deployment

1. Go to the **Actions** tab in your GitHub repository
2. Click on the latest workflow run
3. Watch the build and deploy steps in real-time
4. The deployment URL will appear once complete

## Troubleshooting

### Build Fails Locally

```bash
# Clear cache and rebuild
rm -rf dist node_modules .vite
npm install
npm run build
```

### GitHub Actions Fails

Check common issues:

- Node.js version mismatch (workflow uses Node 20)
- Missing dependencies in `package.json`
- Build errors (check the Actions log)

### Site Not Updating

- Wait 2-5 minutes for GitHub Pages cache to update
- Clear browser cache or try incognito mode
- Check deployment status in Settings → Pages

### Base Path Issues

If assets don't load, verify `vite.config.ts` has correct base:

```typescript
export default defineConfig({
  base: "/code-connect-builder/", // Must match repo name
  // ...
});
```

## Configuration Details

### package.json Scripts

```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

- `predeploy`: Automatically runs before deploy
- `deploy`: Publishes `dist` folder to gh-pages branch

### GitHub Actions Workflow

- **Build job**: Installs deps, builds project, uploads artifact
- **Deploy job**: Deploys artifact to GitHub Pages
- **Permissions**: Read contents, write to Pages, use ID token
- **Concurrency**: Only one deployment at a time

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file in the `public` folder with your domain:

   ```
   www.yourdomain.com
   ```

2. Configure DNS with your domain provider:
   - Add CNAME record pointing to `[username].github.io`

3. Enable HTTPS in GitHub Pages settings

## Development Workflow

```bash
# Local development
npm run dev

# Preview production build
npm run build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## Notes

- The `gh-pages` branch is automatically created and managed
- Don't manually edit the `gh-pages` branch
- The `dist` folder is git-ignored and generated at build time
- Deployment typically takes 1-5 minutes to go live
