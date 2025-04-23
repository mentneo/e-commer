# Setting Up Vercel Project Configuration

This guide helps you set up your Vercel project for the first time and prepare all necessary configuration for deployment.

## Initial Setup

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel (you'll be prompted to authenticate in browser):
   ```bash
   vercel login
   ```

## Environment Variables Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your actual Firebase configuration values

3. When deploying to Vercel, you'll need to add these same environment variables to your Vercel project settings.

## Link Your Project to Vercel

```bash
vercel link
```

This will:
- Create a `.vercel` directory (which is gitignored)
- Link your local project to a Vercel project

## Prepare GitHub Actions

If using GitHub Actions for CI/CD, you'll need to set up these secrets in your GitHub repository:

1. Go to your GitHub repository → Settings → Secrets → Actions
2. Add the following secrets:
   - `VERCEL_TOKEN`: Your Vercel personal access token (get from Vercel account settings)
   - `VERCEL_ORG_ID`: Find in `.vercel/project.json` after running `vercel link`
   - `VERCEL_PROJECT_ID`: Find in `.vercel/project.json` after running `vercel link`

## Configuring Vercel Settings

For optimal settings, configure your project on the Vercel dashboard:

1. **Build & Development Settings**:
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm ci`
   - Development Command: `npm start`

2. **Environment Variables**:
   Add all the environment variables from your `.env` file

3. **Git Integration**:
   - Enable "Automatically expose System Environment Variables"
   - Configure production branch (main/master)

## Preview and Production Environments

Vercel automatically creates environments:
- **Production**: Deployed from your main branch
- **Preview**: Deployed from pull requests
- **Development**: Your local environment

## Branch Deployments

Different branches get unique URLs when you deploy via the `vercel` command or Git integration:
- Production URL: `your-project.vercel.app`
- Preview URL: `your-project-git-branch-name.vercel.app`

## Using Custom Domains

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow the DNS configuration instructions

## Deployment Protection

To add password protection to preview deployments:
1. Go to Vercel Dashboard → Your Project → Settings → Git
2. Under "Preview Deployment Protection", enable password protection
3. Set a username and password
