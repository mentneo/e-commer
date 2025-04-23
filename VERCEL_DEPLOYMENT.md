# Deploying to Vercel

This guide explains how to deploy the Supermarket eCommerce application to Vercel.

## Prerequisites

1. **Vercel Account**: Create a [Vercel account](https://vercel.com/signup) if you don't have one
2. **Vercel CLI**: (Optional) Install the Vercel CLI globally for command line deployments:
   ```bash
   npm install -g vercel
   ```
3. **Vercel Login**: Login to Vercel CLI (if using CLI)
   ```bash
   vercel login
   ```
4. **Environment Variables**: Prepare your Firebase configuration variables

## Deployment Methods

### Method 1: Using Vercel Dashboard (Recommended for first-time deployment)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Login to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project" or "Import Project"
4. Connect to your Git repository
5. Configure project settings:
   - Framework Preset: `Create React App`
   - Root Directory: `./` (or your project directory)
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`
6. Set environment variables (under Environment Variables section):
   ```
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
   ```
7. Click "Deploy"

### Method 2: Using Deployment Script (Recommended for subsequent deployments)

We've included a deployment script for easier deployment:

1. Make the script executable (first time only):
   ```bash
   chmod +x vercel-deploy.js
   ```

2. Deploy to preview environment (for testing):
   ```bash
   npm run deploy
   ```

3. Deploy to production:
   ```bash
   npm run deploy:prod
   ```

### Method 3: Using Vercel CLI directly

1. Navigate to your project directory 
2. Deploy to preview environment:
   ```bash
   vercel
   ```
3. Deploy to production:
   ```bash
   vercel --prod
   ```

## Environment Variables

Add these environment variables in the Vercel project settings:

```
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
```

## Custom Domain Setup

After deployment, you can add a custom domain:

1. Go to your project in the Vercel dashboard
2. Navigate to "Settings" > "Domains"
3. Add your domain and follow the DNS configuration instructions

## Important Notes

1. **Preview URLs**: Each deployment gets a unique preview URL, even before merging to production
2. **Environment Branches**: By default, `main` or `master` branch is deployed to production
3. **Build Cache**: Vercel caches build dependencies to speed up deployments
4. **Serverless Functions**: If you add API routes later, they'll be deployed as serverless functions

## Troubleshooting

### Build Failures

If your build fails, check:
- The Vercel build logs for specific error messages
- Make sure all dependencies are correctly installed
- Verify that environment variables are set correctly
- Try building locally with `npm run build` to debug issues

### CORS or API Issues

If your deployed app can't connect to Firebase:
- Check your Firebase security rules allow requests from your Vercel domain
- Verify environment variables are correctly set in Vercel
- Make sure your Firebase project is properly configured for web use

### Preview Deployments Not Updated

If preview deployments don't reflect your latest changes:
- Clear the Vercel cache from project settings
- Try force deploying with `vercel --force`

## Monitoring & Analytics

Vercel provides built-in analytics and monitoring:
1. Go to your project dashboard
2. Navigate to "Analytics" to view performance metrics
3. Check "Logs" for runtime issues in production
4. Enable "Usage" to track serverless function execution

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Create React App on Vercel](https://vercel.com/guides/deploying-react-with-vercel)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
