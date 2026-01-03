# Database Setup Guide for Vercel

Since you're using MySQL Workbench (which is a database management tool, not a hosting service), you need to set up a **cloud MySQL database** for Vercel deployment.

## Why You Need a Cloud Database

- **MySQL Workbench** = Tool to manage databases (works with local or remote databases)
- **Vercel** = Cloud hosting (needs a cloud database, can't connect to localhost)
- **Your local database** = Only accessible from your computer, not from Vercel's servers

## Quick Setup Options (FREE)

### Option 1: PlanetScale (Recommended - Easiest & Free)

1. Go to https://planetscale.com
2. Sign up (free tier available)
3. Create a new database:
   - Click "Create database"
   - Name it (e.g., `canteen_db`)
   - Choose a region closest to you
   - Click "Create database"
4. Get connection details:
   - Click on your database
   - Click "Connect" button
   - Copy the connection string or note:
     - **Host** (e.g., `aws.connect.psdb.cloud`)
     - **Username**
     - **Password** (click "New password" to generate one)
     - **Database name**
5. Import your schema:
   - Click "Console" tab in PlanetScale
   - Or use MySQL Workbench to connect to PlanetScale and run your schema.sql
   - Or use PlanetScale CLI

### Option 2: Railway (Simple Setup)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Provision MySQL"
4. Once created:
   - Click on the MySQL service
   - Go to "Variables" tab
   - Copy: `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`
5. Import your schema using Railway's MySQL terminal or MySQL Workbench

### Option 3: AWS RDS (Free Tier Available)

1. Go to AWS Console
2. Create RDS MySQL instance (free tier: `db.t2.micro`)
3. Configure security group to allow connections
4. Get connection details from RDS dashboard
5. Import schema using MySQL Workbench

## After Setting Up Cloud Database

### Step 1: Import Your Database Schema

You need to import your database structure. Look for `frontend/src/schema.sql` or create tables using MySQL Workbench connected to your cloud database.

### Step 2: Add Environment Variables in Vercel

In your Vercel project settings, add these environment variables:

```
DB_HOST = your-cloud-database-host.com
DB_USER = your-username
DB_PASSWORD = your-password
DB_NAME = canteen_db
DB_PORT = 3306
DB_SSL = true
```

**For PlanetScale:**
- DB_SSL = true (required)
- Port is usually 3306

**For Railway:**
- Use the variables from Railway dashboard
- DB_SSL might be false

**For AWS RDS:**
- DB_SSL = true (recommended)
- Port is usually 3306

### Step 3: Connect MySQL Workbench to Cloud Database

You can still use MySQL Workbench to manage your cloud database:

1. Open MySQL Workbench
2. Click "+" to add new connection
3. Enter:
   - **Connection Name**: Cloud DB (or any name)
   - **Hostname**: Your cloud DB host (from provider)
   - **Port**: 3306 (usually)
   - **Username**: Your cloud DB username
   - **Password**: Click "Store in Keychain" and enter password
   - **Default Schema**: canteen_db (or your database name)
4. Click "Test Connection"
5. If successful, click "OK" and connect

### Step 4: Import Your Schema

1. Connect to your cloud database in MySQL Workbench
2. Open your schema file (if you have one at `frontend/src/schema.sql`)
3. Or manually create tables through MySQL Workbench
4. Run the SQL to create tables and structure

## Local Development

For local development, you can continue using:
- **Local MySQL** (localhost:3306)
- **MySQL Workbench** to manage it

The code will automatically use:
- `localhost` when running locally (development)
- Cloud database when deployed on Vercel (production)

## Need Help?

If you need help:
1. Choosing a database provider
2. Setting up the database
3. Importing your schema
4. Connecting MySQL Workbench to cloud database

Just let me know which provider you want to use, and I can provide more detailed steps!

