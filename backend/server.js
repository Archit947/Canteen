const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// --- Login ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.query(
    'SELECT * FROM admins WHERE (username = ? OR user_id = ?) AND password = ?',
    [username, username, password],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length > 0) {
        const user = results[0];
        delete user.password; // Don't send password back
        res.json(user);
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    }
  );
});

// --- Admin management ---
app.get('/api/admins', (req, res) => {
  db.query('SELECT id, user_id, username, role, branch_id, canteen_id FROM admins', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post('/api/admins', (req, res) => {
  const { user_id, username, password, role, branch_id, canteen_id } = req.body;
  const allowedRoles = ['main_admin', 'branch_admin', 'canteen_admin'];

  if (!user_id || !username || !password || !role) {
    return res.status(400).json({ message: 'user_id, username, password, and role are required' });
  }
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  if (role === 'branch_admin' && !branch_id) {
    return res.status(400).json({ message: 'branch_id is required for branch_admin' });
  }
  if (role === 'canteen_admin' && !canteen_id) {
    return res.status(400).json({ message: 'canteen_id is required for canteen_admin' });
  }

  const sql = `
    INSERT INTO admins (user_id, username, password, role, branch_id, canteen_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const branchValue = role === 'branch_admin' ? branch_id : null;
  const canteenValue = role === 'canteen_admin' ? canteen_id : null;

  db.query(sql, [user_id, username, password, role, branchValue, canteenValue], (err, result) => {
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
  });
});

app.put('/api/admins/:id', (req, res) => {
  const { id } = req.params;
  const { role, branch_id, canteen_id } = req.body;

  const allowedRoles = ['main_admin', 'branch_admin', 'canteen_admin'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const branchIdToSet = role === 'branch_admin' ? branch_id || null : null;
  const canteenIdToSet = role === 'canteen_admin' ? canteen_id || null : null;

  const sql = 'UPDATE admins SET role = ?, branch_id = ?, canteen_id = ? WHERE id = ?';
  db.query(sql, [role, branchIdToSet, canteenIdToSet, id], (err) => {
    if (err) {
      console.error('Database error on updating admin role:', err);
      return res.status(500).json(err);
    }
    res.json({ id, role, branch_id: branchIdToSet, canteen_id: canteenIdToSet });
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
  db.query('INSERT INTO branches (name) VALUES (?)', [name], (err, result) => {
    if (err) {
      console.error("Database error on inserting branch:", err);
      return res.status(500).json(err);
    }
    res.json({ id: result.insertId, name });
  });
});

// --- Canteens ---
app.get('/api/canteens', (req, res) => {
  const { branch_id } = req.query;
  let sql = 'SELECT * FROM canteens';
  const params = [];
  if (branch_id) {
    sql += ' WHERE branch_id = ?';
    params.push(branch_id);
  }
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post('/api/canteens', (req, res) => {
  const { name, branch_id } = req.body;
  db.query('INSERT INTO canteens (name, branch_id) VALUES (?, ?)', [name, branch_id], (err, result) => {
    if (err) {
      console.error("Database error on inserting canteen:", err);
      return res.status(500).json(err);
    }
    res.json({ id: result.insertId, name, branch_id });
  });
});

// --- Menu Items ---
app.get('/api/menus', (req, res) => {
  const { canteen_id, branch_id } = req.query;

  let sql = 'SELECT m.* FROM menu_items m';
  const params = [];

  if (canteen_id) {
    sql += ' WHERE m.canteen_id = ?';
    params.push(canteen_id);
  } else if (branch_id) {
    sql += ' JOIN canteens c ON m.canteen_id = c.id WHERE c.branch_id = ?';
    params.push(branch_id);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching menus:", err);
      return res.status(500).json({ 
        message: err.message || 'Database error',
        sqlMessage: err.sqlMessage,
        code: err.code 
      });
    }
    res.json(results);
  });
});

app.post('/api/menus', (req, res) => {
  const { name, price, photo, canteen_id } = req.body;
  db.query('INSERT INTO menu_items (name, price, photo, canteen_id) VALUES (?, ?, ?, ?)', [name, price, photo, canteen_id], (err, result) => {
    if (err) {
      console.error("Database error on inserting menu item:", err);
      return res.status(500).json(err);
    }
    res.json({ id: result.insertId, name, price, photo, canteen_id });
  });
});

app.put('/api/menus/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, photo, canteen_id } = req.body;
  const sql = 'UPDATE menu_items SET name = ?, price = ?, photo = ?, canteen_id = ? WHERE id = ?';
  db.query(sql, [name, price, photo, canteen_id, id], (err, result) => {
    if (err) return res.status(500).json(err);
    // Return the updated fields along with the ID
    res.json({ id: Number(id), name, price, photo, canteen_id });
  });
});

app.delete('/api/menus/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM menu_items WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Deleted successfully', id });
  });
});

// --- Orders ---
app.get('/api/orders', (req, res) => {
  const { branch_id, canteen_id } = req.query;
  let query = 'SELECT * FROM orders';
  let params = [];

  const sendResponse = (sqlQuery, sqlParams) => {
    db.query(sqlQuery, sqlParams, (err, results) => {
      if (err) return res.status(500).json(err);
      const mappedResults = results.map(order => ({
        id: order.order_id,
        db_id: order.id,
        item: order.item_names,
        branch: order.branch_name,
        canteen: order.canteen_name,
        employee: order.employee_name,
        total: order.total_amount,
        status: order.status,
        date: order.created_at,
        qr: order.qr_code
      }));
      res.json(mappedResults);
    });
  };

  if (branch_id) {
    // Get branch name first to filter by name
    db.query('SELECT name FROM branches WHERE id = ?', [branch_id], (err, bResults) => {
      if (err) return res.status(500).json(err);
      if (bResults.length > 0) {
        query += ' WHERE branch_name = ? ORDER BY created_at DESC';
        params.push(bResults[0].name);
        sendResponse(query, params);
      } else {
        res.json([]);
      }
    });
  } else if (canteen_id) {
    // Get canteen name first
    db.query('SELECT name FROM canteens WHERE id = ?', [canteen_id], (err, cResults) => {
      if (err) return res.status(500).json(err);
      if (cResults.length > 0) {
        query += ' WHERE canteen_name = ? ORDER BY created_at DESC';
        params.push(cResults[0].name);
        sendResponse(query, params);
      } else {
        res.json([]);
      }
    });
  } else {
    query += ' ORDER BY created_at DESC';
    sendResponse(query, params);
  }
});

app.post('/api/orders', (req, res) => {
  const { item_names, branch_name, canteen_name, employee_name, total_amount, status } = req.body;
  const created_at = new Date();
  // Human‑readable QR payload so scanners show clear order details
  const qr_code =
    `Name: ${employee_name}\n` +
    `Items: ${item_names}\n` +
    `Branch: ${branch_name}\n` +
    `Canteen: ${canteen_name}\n` +
    `Total: ${total_amount}\n` +
    `Status: ${status}`;
  const sql = 'INSERT INTO orders (order_id, item_names, branch_name, canteen_name, employee_name, total_amount, status, created_at, qr_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, ['0000', item_names, branch_name, canteen_name, employee_name, total_amount, status, created_at, qr_code], (err, result) => {
    if (err) {
      console.error("Database error on inserting order:", err);
      return res.status(500).json(err);
    }

    const insertId = result.insertId;
    const formattedOrderId = String(insertId).padStart(4, '0');

    db.query('UPDATE orders SET order_id = ? WHERE id = ?', [formattedOrderId, insertId], (updateErr) => {
      if (updateErr) {
        console.error("Database error on updating order_id:", updateErr);
        return res.status(500).json(updateErr);
      }
      res.json({ 
        id: formattedOrderId, 
        item: item_names, 
        branch: branch_name, 
        canteen: canteen_name,
        employee: employee_name, 
        total: total_amount, 
        status,
        date: created_at,
        qr: qr_code
      });
    });
  });
});

app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  const sql = 'UPDATE orders SET status = ? WHERE order_id = ?';
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error('Database error on updating order status:', err);
      return res.status(500).json(err);
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Fetch the updated order, refresh QR payload with live status, and return it
    db.query('SELECT * FROM orders WHERE order_id = ?', [id], (err, results) => {
      if (err) {
        console.error('Database error on fetching updated order:', err);
        return res.status(500).json(err);
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Updated order not found, which is unexpected.' });
      }
      const order = results[0];

      // Regenerate QR payload so it always reflects live status and details
      const qr_code =
        `Name: ${order.employee_name}\n` +
        `Items: ${order.item_names}\n` +
        `Branch: ${order.branch_name}\n` +
        `Canteen: ${order.canteen_name}\n` +
        `Total: ${order.total_amount}\n` +
        `Status: ${order.status}`;

      // Persist refreshed QR code in DB and then respond
      db.query('UPDATE orders SET qr_code = ? WHERE id = ?', [qr_code, order.id], (qrErr) => {
        if (qrErr) {
          console.error('Database error on updating qr_code:', qrErr);
          return res.status(500).json(qrErr);
        }

        const mappedOrder = {
          id: order.order_id,
          db_id: order.id,
          item: order.item_names,
          branch: order.branch_name,
          canteen: order.canteen_name,
          employee: order.employee_name,
          total: order.total_amount,
          status: order.status,
          date: order.created_at,
          qr: qr_code
        };
        res.json(mappedOrder);
      });
    });
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});