-- PostgreSQL Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- Create canteens table
CREATE TABLE IF NOT EXISTS canteens (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price VARCHAR(50) NOT NULL,
  photo TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  canteen_id INTEGER REFERENCES canteens(id) ON DELETE SET NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50),
  item_names TEXT,
  branch_name VARCHAR(255),
  canteen_name VARCHAR(255),
  employee_name VARCHAR(255),
  total_amount VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Ordered',
  qr_code VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admins table
-- Using VARCHAR for role instead of ENUM (PostgreSQL ENUMs require type creation)
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('main_admin', 'branch_admin', 'canteen_admin')),
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  canteen_id INTEGER REFERENCES canteens(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_canteens_branch_id ON canteens(branch_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_canteen_id ON menu_items(canteen_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
