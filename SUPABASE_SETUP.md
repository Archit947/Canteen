# Supabase Setup Guide for Vercel Deployment

This guide will help you set up Supabase (PostgreSQL) for your Admin Dashboard application.

## Step 1: Create Supabase Account and Project

1. Go to https://supabase.com
2. Sign up for a free account (GitHub login recommended)
3. Click "New Project"
4. Fill in project details:
   - **Name**: `canteen-dashboard` (or any name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine
5. Click "Create new project"
6. Wait 1-2 minutes for project to be set up

## Step 2: Get Database Connection Details

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to "Connection string" section
3. Click on "URI" tab
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)
5. **OR** use individual parameters:
   - **Host**: `db.xxxxx.supabase.co` (from Connection string)
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: The password you set when creating the project

## Step 3: Import Database Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Open the file `frontend/src/schema.sql` from your project
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click "Run" (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

## Step 4: Set Up Environment Variables in Vercel

Go to your Vercel project settings and add these environment variables:

### Option A: Using Connection String (Recommended)

```
DATABASE_URL = postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
DB_SSL = true
```

Replace `[YOUR-PASSWORD]` with your actual password and update the host.

### Option B: Using Individual Parameters

```
DB_HOST = db.xxxxx.supabase.co
DB_PORT = 5432
DB_NAME = postgres
DB_USER = postgres
DB_PASSWORD = your_password_here
DB_SSL = true
```

**Important:** 
- Add these for **Production**, **Preview**, and **Development** environments
- The password should NOT have special characters that need URL encoding in the connection string
- If using connection string, make sure to URL-encode special characters in the password

## Step 5: Install Dependencies

The code has been updated to use `pg` (PostgreSQL client) instead of `mysql2`. Make sure to install dependencies:

```bash
cd backend
npm install
```

## Step 6: Verify Connection (Optional)

You can test the connection locally by creating a `.env` file in the backend folder:

```env
DATABASE_URL=postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres
DB_SSL=true
```

Then run your backend server to test.

## Differences from MySQL

The code has been adapted for PostgreSQL:
- ✅ Uses `pg` library instead of `mysql2`
- ✅ Schema uses `SERIAL` instead of `AUTO_INCREMENT`
- ✅ Uses `TEXT` instead of `LONGTEXT`
- ✅ Role column uses `VARCHAR` with `CHECK` constraint instead of `ENUM`
- ✅ Query placeholders automatically converted from `?` to `$1, $2, $3...`

## Troubleshooting

### Connection Refused
- Verify your connection string is correct
- Check that your Supabase project is active
- Ensure password doesn't contain special characters that break the connection string

### SSL Required
- Make sure `DB_SSL=true` is set
- Supabase requires SSL connections

### Authentication Failed
- Double-check your password
- If using connection string, ensure password is properly URL-encoded
- Try using individual parameters instead of connection string

### Schema Errors
- Make sure you ran the schema.sql in Supabase SQL Editor
- Check that tables were created (go to Table Editor in Supabase)

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Import schema
3. ✅ Add environment variables to Vercel
4. ✅ Deploy to Vercel
5. ✅ Test your application

Your application is now ready to use Supabase! 🎉

