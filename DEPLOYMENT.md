# Deployment Guide for Vercel

## Prerequisites

- Node.js 18+ installed
- Vercel CLI installed (`npm i -g vercel`)
- Git repository set up

## Quick Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. Navigate to the project directory:

   ```bash
   cd flow-executor
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Deploy to Vercel:

   ```bash
   vercel
   ```

4. Follow the prompts:
   - Link to existing project or create new
   - Confirm deployment settings
   - Wait for build and deployment

### Option 2: Deploy via Vercel Dashboard

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Configure build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Deploy

## Configuration Files Added

### vercel.json

- Specifies build command and output directory
- Configures SPA routing (all routes serve index.html)
- Sets up caching headers for static assets

### Updated vite.config.ts

- Optimized build configuration
- Code splitting for better performance
- Production-ready settings

## Environment Variables

If your app needs environment variables, add them in the Vercel dashboard under Project Settings > Environment Variables.

## Custom Domain

After deployment, you can add a custom domain in the Vercel dashboard under Project Settings > Domains.

## Troubleshooting

- If build fails, check the build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation passes locally with `npm run build`
