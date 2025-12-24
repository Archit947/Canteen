const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Login (username or user_id) ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.query(
    'SELECT * FROM admins WHERE (username = ? OR user_id = ?) AND password = ?',
    [username, username, password],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length > 0) {
        const user = results[0];
        delete user.password;
        res.json(user);
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    }
  );
});

// --- Admin management ---
app.get('/api/admins', (req, res) => {
  db.query(
    'SELECT id, user_id, username, role, branch_id, canteen_id FROM admins',
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

app.post('/api/admins', (req, res) => {
  const { user_id, username, password, role, branch_id, canteen_id } = req.body;
  const allowedRoles = ['main_admin', 'branch_admin', 'canteen_admin'];

  if (!user_id || !username || !password || !role) {
    return res
      .status(400)
      .json({ message: 'user_id, username, password, and role are required' });
  }
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  if (role === 'branch_admin' && !branch_id) {
    return res
      .status(400)
      .json({ message: 'branch_id is required for branch_admin' });
  }
  if (role === 'canteen_admin' && !canteen_id) {
    return res
      .status(400)
      .json({ message: 'canteen_id is required for canteen_admin' });
  }

  const sql =
    'INSERT INTO admins (user_id, username, password, role, branch_id, canteen_id) VALUES (?, ?, ?, ?, ?, ?)';
  const branchValue = role === 'branch_admin' ? branch_id : null;
  const canteenValue = role === 'canteen_admin' ? canteen_id : null;

  db.query(
    sql,
    [user_id, username, password, role, branchValue, canteenValue],
    (err, result) => {
      if (err) {
        console.error('Database error on creating admin:', err);
        return res.status(500).json(err);
      }
      res.status(201).json({
        id: result.insertId,
        user_id,
        username,
        role,
        branch_id: branchValue,
        canteen_id: canteenValue
      });
    }
  );
});

app.put('/api/admins/:id', (req, res) => {
  const { id } = req.params;
  const { role, branch_id, canteen_id } = req.body;
  const allowedRoles = ['main_admin', 'branch_admin', 'canteen_admin'];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const branchValue = role === 'branch_admin' ? branch_id || null : null;
  const canteenValue = role === 'canteen_admin' ? canteen_id || null : null;

  const sql =
    'UPDATE admins SET role = ?, branch_id = ?, canteen_id = ? WHERE id = ?';
  db.query(sql, [role, branchValue, canteenValue, id], (err) => {
    if (err) {
      console.error('Database error on updating admin:', err);
      return res.status(500).json(err);
    }
    res.json({ id, role, branch_id: branchValue, canteen_id: canteenValue });
  });
});

app.delete('/api/admins/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM admins WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Database error on deleting admin:', err);
      return res.status(500).json(err);
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json({ id });
  });
});

// --- Branches ---
app.get('/api/branches', (req, res) => {
  db.query('SELECT * FROM branches', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post('/api/branches', (req, res) => {
  const { name } = req.body;
  db.query(
    'INSERT INTO branches (name) VALUES (?)',
    [name],
    (err, result) => {
      if (err) {
        console.error('Database error on inserting branch:', err);
        return res.status(500).json(err);
      }
      res.json({ id: result.insertId, name });
    }
  );
});

app.delete('/api/branches/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM branches WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Database error on deleting branch:', err);
      if (err.errno === 1451) return res.status(400).json({ message: 'Cannot delete branch: It has associated canteens or users.' });
      return res.status(500).json(err);
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    res.json({ id });
  });
});

// --- Canteens ---
app.get('/api/canteens', (req, res) => {
  db.query('SELECT * FROM canteens', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post('/api/canteens', (req, res) => {
  const { name, branch_id } = req.body;
  db.query(
    'INSERT INTO canteens (name, branch_id) VALUES (?, ?)',
    [name, branch_id],
    (err, result) => {
      if (err) {
        console.error('Database error on inserting canteen:', err);
        return res.status(500).json(err);
      }
      res.json({ id: result.insertId, name, branch_id });
    }
  );
});

// --- Menu items ---
app.get('/api/menus', (req, res) => {
  db.query('SELECT * FROM menu_items WHERE is_active = TRUE', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post('/api/menus', (req, res) => {
  const { name, price, photo, canteen_id } = req.body;
  db.query(
    'INSERT INTO menu_items (name, price, photo, canteen_id) VALUES (?, ?, ?, ?)',
    [name, price, photo, canteen_id || null],
    (err, result) => {
      if (err) {
        console.error('Database error on inserting menu item:', err);
        return res.status(500).json(err);
      }
      res.json({ id: result.insertId, name, price, photo, canteen_id });
    }
  );
});

// --- Orders ---
app.get('/api/canteen_orders', (req, res) => {
  // You can extend this to filter by branch_id / canteen_id if needed.
  db.query('SELECT * FROM orders ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json(err);
    const mapped = results.map((row) => ({
      id: row.order_id,
      db_id: row.id,
      item: row.item_names,
      branch: row.branch_name,
      canteen: row.canteen_name,
      employee: row.employee_name,
      total: row.total_amount,
      status: row.status,
      qr: row.qr_code,
      date: row.created_at
    }));
    res.json(mapped);
  });
});

app.post('/api/canteen_orders', (req, res) => {
  const {
    order_id,
    item_names,
    branch_name,
    canteen_name,
    employee_name,
    total_amount,
    status,
    qr_code
  } = req.body;

  const sql =
    'INSERT INTO orders (order_id, item_names, branch_name, canteen_name, employee_name, total_amount, status, qr_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(
    sql,
    [
      order_id,
      item_names,
      branch_name,
      canteen_name,
      employee_name,
      total_amount,
      status || 'Ordered',
      qr_code || null,
      new Date()
    ],
    (err) => {
      if (err) {
        console.error('Database error on inserting order:', err);
        return res.status(500).json(err);
      }
      res.json({
        id: order_id,
        item: item_names,
        branch: branch_name,
        canteen: canteen_name,
        employee: employee_name,
        total: total_amount,
        status: status || 'Ordered',
        qr: qr_code || null,
        date: new Date()
      });
    }
  );
});

// Get single order by order_id
app.get('/api/canteen_orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  db.query('SELECT * FROM orders WHERE order_id = ?', [orderId], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(results[0]);
  });
});

// Update order status by order_id (used by admin UI)
app.put('/api/canteen_orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  const sql = 'UPDATE orders SET status = ? WHERE order_id = ?';
  db.query(sql, [status, orderId], (err, result) => {
    if (err) {
      console.error('Database error on updating order:', err);
      return res.status(500).json(err);
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ id: orderId, status });
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
