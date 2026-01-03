# Environment Variables for Vercel (Supabase)

## Quick Setup Guide

When deploying to Vercel with Supabase, you have **two options**:

---

## Option 1: Use Connection String (RECOMMENDED) ⭐

This is the easiest and recommended method.

### Steps:

1. Go to your Supabase project dashboard
2. Click **Settings** → **Database**
3. Scroll to **"Connection string"** section
4. Click on the **"URI"** tab
5. Copy the connection string (looks like this):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### In Vercel:

1. Go to your project → **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Add this variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the connection string you copied
   - **Environments**: Select Production, Preview, and Development
4. Click **"Save"**

**That's it!** The connection string includes everything (host, port, user, password, database).

---

## Option 2: Use Individual Parameters

If you prefer to use separate environment variables:

### Get Values from Supabase:

1. Go to Supabase dashboard → **Settings** → **Database**
2. In the **"Connection string"** section, you'll see:
   - **Host**: `db.xxxxx.supabase.co` (your unique host)
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: The password you set when creating the project

### In Vercel:

Add these environment variables (select all environments: Production, Preview, Development):

| Key | Value | Example |
|-----|-------|---------|
| `DB_HOST` | Your Supabase database host | `db.abcdefghijklmn.supabase.co` |
| `DB_PORT` | `5432` | `5432` |
| `DB_NAME` | `postgres` | `postgres` |
| `DB_USER` | `postgres` | `postgres` |
| `DB_PASSWORD` | Your Supabase database password | `your-secure-password` |
| `DB_SSL` | `true` | `true` |

---

## Which Option Should You Use?

**Use Option 1 (DATABASE_URL)** because:
- ✅ Simpler - only one variable to add
- ✅ Less chance of errors
- ✅ Recommended by Supabase
- ✅ Easier to update if password changes

**Use Option 2 (Individual parameters)** if:
- You want to use different credentials per environment
- Your deployment platform requires separate variables
- You prefer explicit configuration

---

## Important Notes:

1. **Password in Connection String**: 
   - If your password has special characters (like `@`, `#`, `%`, etc.), you need to URL-encode them
   - Example: `@` becomes `%40`, `#` becomes `%23`
   - Or just use individual parameters (Option 2) to avoid encoding

2. **All Environments**: 
   - Make sure to select **Production**, **Preview**, and **Development** when adding variables
   - Or add them separately for each environment if needed

3. **Security**:
   - Never commit these values to Git
   - They're stored securely in Vercel
   - Only accessible in your project settings

---

## Example Values:

### Option 1 (Connection String):
```
DATABASE_URL=postgresql://postgres:mypassword123@db.abcdefghijk.supabase.co:5432/postgres
DB_SSL=true
```

### Option 2 (Individual Parameters):
```
DB_HOST=db.abcdefghijk.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=mypassword123
DB_SSL=true
```

---

## After Adding Variables:

1. Go back to your Vercel project dashboard
2. Click **"Deployments"** tab
3. Click the **"..."** menu on your latest deployment
4. Click **"Redeploy"** to apply the new environment variables

Or just push a new commit to trigger a new deployment with the variables!

