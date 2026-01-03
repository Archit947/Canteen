# How to Find Supabase Connection String

You're on the Database Settings page. The connection string is on the **same page**, but you need to scroll down or look for a specific section.

## Steps to Find Connection String:

1. **You're already on the right page**: Settings → Database ✅

2. **Scroll down** on the Database Settings page - the connection string section is below the sections you can see (Database password, Connection pooling, SSL Configuration)

3. **Look for a section called:**
   - "Connection string" 
   - "Connection info"
   - "Connection parameters"
   - "Database URL"

4. **Alternative method - Use the "Connect" button:**
   - Look at the **top right** of your Supabase dashboard
   - You should see a **"Connect"** button (green button)
   - Click on it
   - It will show connection options including the connection string

5. **What the Connection String section looks like:**
   - It will have tabs: "URI", "JDBC", "Connection Pooling", etc.
   - Click on the **"URI"** tab
   - You'll see the connection string like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
     ```

## Quick Alternative - Connection Parameters:

If you can't find the connection string, you can also get the individual values:

1. Stay on the Database Settings page
2. Look for any section showing:
   - **Host** (looks like: `db.xxxxx.supabase.co`)
   - **Port** (usually `5432`)
   - **Database name** (usually `postgres`)
   - **User** (usually `postgres`)
   - **Password** (you set this when creating the project)

3. You can also see the host in your browser's address bar or project URL

## If You Still Can't Find It:

1. **Try the "Connect" button** at the top of the page (next to your project name)
2. **Check the project overview page** - sometimes connection info is shown there
3. **Look for "API" or "Database" in the left sidebar** - there might be a direct link to connection info

The connection string is definitely there - it might just be further down on the page or in a collapsible section!

