CREATE DATABASE IF NOT EXISTS canteen_db;
USE canteen_db;

CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS canteens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT,
  name VARCHAR(255) NOT NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price VARCHAR(50) NOT NULL,
  photo LONGTEXT,
  is_active BOOLEAN DEFAULT TRUE,
  canteen_id INT,
  FOREIGN KEY (canteen_id) REFERENCES canteens(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('main_admin', 'branch_admin', 'canteen_admin') NOT NULL,
  branch_id INT,
  canteen_id INT,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (canteen_id) REFERENCES canteens(id)
);