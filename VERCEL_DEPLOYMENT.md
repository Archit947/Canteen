# Vercel Deployment Guide

This guide will help you deploy your Admin Dashboard application to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A cloud database (recommended options):
   - **Supabase** (PostgreSQL) - **Currently Configured**: https://supabase.com (free tier available)
   - **PlanetScale** (MySQL): https://planetscale.com
   - **AWS RDS**: https://aws.amazon.com/rds
   - **Railway**: https://railway.app
   
   **Note**: This project is configured for Supabase (PostgreSQL). See `SUPABASE_SETUP.md` for setup instructions.

3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Set Up Supabase Database

**This project is configured for Supabase (PostgreSQL).**

1. Follow the detailed instructions in `SUPABASE_SETUP.md`
2. Create a Supabase account and project at https://supabase.com
3. Get your database connection details (connection string or individual parameters)
4. Import your database schema:
   - Go to Supabase SQL Editor
   - Copy the schema from `frontend/src/schema.sql`
   - Run it in the SQL Editor

## Step 2: Prepare Your Code

The code has already been prepared for Vercel deployment. The structure is:
- `api/` - Backend API (serverless functions)
- `frontend/` - React frontend application
- `backend/` - Original backend code (used by api/index.js)

## Step 3: Install Dependencies Locally (Optional but Recommended)

Before deploying, you can test the build locally:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Build frontend (to test)
npm run build
```

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Navigate to your project root:
   ```bash
   cd D:\Admindashboard
   ```

4. Deploy:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (Select your account)
   - Link to existing project? **No** (for first deployment)
   - Project name? (Press Enter for default or enter a name)
   - Directory? (Press Enter for current directory)
   - Override settings? **No**

5. Set environment variables:
   ```bash
   vercel env add DB_HOST
   vercel env add DB_USER
   vercel env add DB_PASSWORD
   vercel env add DB_NAME
   vercel env add DB_PORT
   vercel env add DB_SSL
   ```
   
   When prompted:
   - Select **Production**, **Preview**, and **Development** environments
   - Enter the values from your cloud database

6. Redeploy with environment variables:
   ```bash
   vercel --prod
   ```

### Option B: Deploy via Vercel Dashboard

1. Push your code to GitHub/GitLab/Bitbucket

2. Go to https://vercel.com/dashboard

3. Click **"Add New..."** → **"Project"**

4. Import your Git repository

5. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/build`

6. Add Environment Variables:
   Click **"Environment Variables"** and add:
   
   **Option A: Using Connection String (Recommended)**
   - `DATABASE_URL` - Your Supabase connection string (from Settings → Database)
   - `DB_SSL` - Set to `true`
   
   **Option B: Using Individual Parameters**
   - `DB_HOST` - Your Supabase database host (e.g., db.xxxxx.supabase.co)
   - `DB_USER` - `postgres`
   - `DB_PASSWORD` - Your Supabase database password
   - `DB_NAME` - `postgres`
   - `DB_PORT` - `5432`
   - `DB_SSL` - `true`
   
   See `SUPABASE_SETUP.md` for detailed instructions on getting these values.

7. Click **"Deploy"**

## Step 5: Update Vercel Configuration (if needed)

If you encounter routing issues, you may need to update `vercel.json`. The current configuration should work, but if you need to adjust it:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*\\.(js|css|ico|png|jpg|jpeg|svg|json|txt|xml|woff|woff2|ttf|eot))",
      "dest": "/frontend/build/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/build/index.html"
    }
  ]
}
```

## Step 6: Verify Deployment

1. After deployment, Vercel will provide you with a URL (e.g., `your-app.vercel.app`)

2. Visit the URL and test:
   - Frontend loads correctly
   - Login functionality works
   - API endpoints respond correctly

3. Check Vercel logs:
   - Go to your project dashboard on Vercel
   - Click **"Functions"** tab to see serverless function logs
   - Check for any errors

## Troubleshooting

### Database Connection Issues

1. **Error: Connection refused**
   - Verify your Supabase connection string is correct
   - Check that your Supabase project is active
   - Ensure you're using the correct port (5432 for PostgreSQL)

2. **Error: SSL required**
   - Set `DB_SSL=true` in environment variables (or use DATABASE_URL which includes SSL)
   - Supabase requires SSL connections

3. **Error: Access denied / Authentication failed**
   - Verify your password is correct (Supabase database password, not your account password)
   - If using connection string, ensure password is properly URL-encoded
   - Try using individual parameters instead of connection string

4. **Error: Relation/Table does not exist**
   - Make sure you've imported the schema.sql in Supabase SQL Editor
   - Check that tables were created (go to Table Editor in Supabase dashboard)

### API Routes Not Working

1. Check that routes are prefixed with `/api`
2. Verify `vercel.json` routing configuration
3. Check function logs in Vercel dashboard

### Frontend Not Loading

1. Verify the build completed successfully
2. Check that `frontend/build` directory exists after build
3. Verify routing configuration in `vercel.json`

### Build Errors

1. Check Node.js version compatibility (Vercel requires Node 20.x or newer, e.g. 24.x)
2. Ensure all dependencies are listed in `package.json`
3. Check build logs in Vercel dashboard for specific errors

## Additional Notes

1. **QR Code Generation**: If you use QR codes that generate URLs, they will use your Vercel domain. Make sure your Vercel URL is correct in the environment.

2. **CORS**: CORS is enabled in the API, so it should work with your frontend domain.

3. **Environment Variables**: Never commit `.env` files. Use Vercel's environment variable management.

4. **Database Migrations**: If you need to run database migrations, you can create a separate script and run it manually or use your database provider's migration tools.

5. **Custom Domain**: Once deployed, you can add a custom domain in Vercel's project settings.

## Support

If you encounter issues:
1. Check Vercel's documentation: https://vercel.com/docs
2. Review serverless function logs in Vercel dashboard
3. Check database connection and credentials
4. Verify all environment variables are set correctly
