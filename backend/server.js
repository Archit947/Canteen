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
      if (err) return res.status(500).json();
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
    if (err) return res.status(500).json();
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
      return res.status(500).json();
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
      return res.status(500).json();
    }
    res.json({ id, role, branch_id: branchIdToSet, canteen_id: canteenIdToSet });
  });
});

app.delete('/api/admins/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM admins WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json();
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
    if (err) return res.status(500).json();
    res.json(results);
  });
});

app.post('/api/branches', (req, res) => {
  const { name } = req.body;
  db.query('INSERT INTO branches (name) VALUES (?)', [name], (err, result) => {
    if (err) {
      return res.status(500).json();
    }
    res.json({ id: result.insertId, name });
  });
});

app.delete('/api/branches/:id', (req, res) => {
  const { id } = req.params;
  
  // First, get all canteens associated with this branch
  db.query('SELECT id FROM canteens WHERE branch_id = ?', [id], (err, canteens) => {
    if (err) {
      return res.status(500).json({ message: 'Error checking associated canteens' });
    }
    
    const canteenIds = canteens.map(c => c.id);
    
    // Delete menu items for all canteens in this branch
    if (canteenIds.length > 0) {
      const placeholders = canteenIds.map(() => '?').join(',');
      db.query(`DELETE FROM menu_items WHERE canteen_id IN (${placeholders})`, canteenIds, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error deleting menu items' });
        }
        
        // After menu items are deleted, delete canteens
        deleteCanteensAndBranch();
      });
    } else {
      // No canteens, proceed directly to unlinking admins and deleting branch
      deleteCanteensAndBranch();
    }
    
    function deleteCanteensAndBranch() {
      // Delete all canteens associated with this branch
      db.query('DELETE FROM canteens WHERE branch_id = ?', [id], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error deleting associated canteens' });
        }
        
        // Unlink admins from this branch (set branch_id to NULL)
        db.query('UPDATE admins SET branch_id = NULL WHERE branch_id = ?', [id], (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error unlinking admins' });
          }
          
          // Now delete the branch
          db.query('DELETE FROM branches WHERE id = ?', [id], (err, result) => {
            if (err) {
              return res.status(500).json({ message: 'Error deleting branch' });
            }
            if (result.affectedRows === 0) {
              return res.status(404).json({ message: 'Branch not found' });
            }
            res.json({ id, message: 'Branch and all associated canteens deleted successfully' });
          });
        });
      });
    }
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
    if (err) return res.status(500).json();
    res.json(results);
  });
});

app.post('/api/canteens', (req, res) => {
  const { name, branch_id } = req.body;
  db.query('INSERT INTO canteens (name, branch_id) VALUES (?, ?)', [name, branch_id], (err, result) => {
    if (err) {
      return res.status(500).json();
    }
    res.json({ id: result.insertId, name, branch_id });
  });
});

app.delete('/api/canteens/:id', (req, res) => {
  const { id } = req.params;

  // 1. Delete associated menu items first
  db.query('DELETE FROM menu_items WHERE canteen_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    // 2. Unlink any admins assigned to this canteen
    db.query('UPDATE admins SET canteen_id = NULL WHERE canteen_id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // 3. Finally delete the canteen
      db.query('DELETE FROM canteens WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Canteen not found' });
        }
        res.json({ id });
      });
    });
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
      return res.status(500).json();
    }
    res.json(results);
  });
});

app.post('/api/menus', (req, res) => {
  const { name, price, photo, canteen_id } = req.body;
  db.query('INSERT INTO menu_items (name, price, photo, canteen_id) VALUES (?, ?, ?, ?)', [name, price, photo, canteen_id], (err, result) => {
    if (err) {
      return res.status(500).json();
    }
    res.json({ id: result.insertId, name, price, photo, canteen_id });
  });
});

app.put('/api/menus/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, photo, canteen_id } = req.body;
  const sql = 'UPDATE menu_items SET name = ?, price = ?, photo = ?, canteen_id = ? WHERE id = ?';
  db.query(sql, [name, price, photo, canteen_id, id], (err, result) => {
    if (err) return res.status(500).json();
    // Return the updated fields along with the ID
    res.json({ id: Number(id), name, price, photo, canteen_id });
  });
});

app.delete('/api/menus/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM menu_items WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json();
    res.json({ message: 'Deleted successfully', id });
  });
});

// --- Orders ---
app.get('/api/canteen_orders', (req, res) => {
  const { branch_id, canteen_id } = req.query;
  let query = 'SELECT * FROM orders';
  let params = [];

  const sendResponse = (sqlQuery, sqlParams) => {
    db.query(sqlQuery, sqlParams, (err, results) => {
      if (err) return res.status(500).json();
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
      if (err) return res.status(500).json();
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
      if (err) return res.status(500).json();
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

app.post('/api/canteen_orders', (req, res) => {
  const { order_id, item_names, branch_name, canteen_name, employee_name, total_amount, status, qr_code } = req.body;
  const created_at = new Date();

  // Use provided order_id or generate one based on insertId
  let finalOrderId = order_id;
  let finalQrCode = qr_code;

  // First insert order
  const sql =
    'INSERT INTO orders (order_id, item_names, branch_name, canteen_name, employee_name, total_amount, status, created_at, qr_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(
    sql,
    [finalOrderId || '0000', item_names, branch_name, canteen_name, employee_name, total_amount, status, created_at, finalQrCode || null],
    (err, result) => {
    if (err) {
      return res.status(500).json();
    }

    const insertId = result.insertId;
    
    // If order_id was not provided, generate one from insertId
    if (!finalOrderId) {
      finalOrderId = String(insertId).padStart(4, '0');
    }

    // If qr_code was not provided, generate one pointing to user-facing order details page
    if (!finalQrCode) {
      // Use the same hostname/port as the request, or default to localhost:3000
      const baseUrl = req.get('origin') || req.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000';
      finalQrCode = `${baseUrl}/orderdetails?id=${encodeURIComponent(finalOrderId)}`;
    }

    // Update order with final order_id and qr_code if they were generated
    if (!order_id || !qr_code) {
      db.query(
        'UPDATE orders SET order_id = ?, qr_code = ? WHERE id = ?',
        [finalOrderId, finalQrCode, insertId],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json();
          }
          res.json({
            id: finalOrderId,
            item: item_names,
            branch: branch_name,
            canteen: canteen_name,
            employee: employee_name,
            total: total_amount,
            status,
            date: created_at,
            qr: finalQrCode,
          });
        }
      );
    } else {
      // Order already has order_id and qr_code, just return the response
      res.json({
        id: finalOrderId,
        item: item_names,
        branch: branch_name,
        canteen: canteen_name,
        employee: employee_name,
        total: total_amount,
        status,
        date: created_at,
        qr: finalQrCode,
      });
    }
  });
});

// Get single order by order_id
app.get('/api/canteen_orders/:orderId', (req, res) => {
  let { orderId } = req.params;
  
  // Decode the orderId in case it's URL encoded
  try {
    orderId = decodeURIComponent(orderId);
  } catch (e) {
    // If decoding fails, use as-is
  }
  
  console.log('Looking for order with ID:', orderId);
  
  // Try multiple formats: as-is, with '#', without '#'
  const orderIdVariants = [
    orderId,  // Try as received
    orderId.startsWith('#') ? orderId.substring(1) : `#${orderId}`  // Try alternate format
  ];
  
  // Remove duplicates
  const uniqueVariants = [...new Set(orderIdVariants)];
  
  let queryIndex = 0;
  const tryNextQuery = () => {
    if (queryIndex >= uniqueVariants.length) {
      console.log('Order not found with any variant:', uniqueVariants);
      return res.status(404).json({ message: 'Order not found', tried: uniqueVariants });
    }
    
    const variant = uniqueVariants[queryIndex];
    console.log(`Trying order_id variant ${queryIndex + 1}:`, variant);
    
    db.query('SELECT * FROM orders WHERE order_id = ?', [variant], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json(err);
      }
      
      if (results.length > 0) {
        console.log('Found order with variant:', variant);
        const row = results[0];
        const mapped = {
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
        };
        return res.json(mapped);
      }
      
      // Try next variant
      queryIndex++;
      tryNextQuery();
    });
  };
  
  tryNextQuery();
});

app.put('/api/canteen_orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  const sql = 'UPDATE orders SET status = ? WHERE order_id = ?';
  db.query(sql, [status, orderId], (err, result) => {
    if (err) {
      return res.status(500).json();
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Fetch the updated order and return it (QR already points to details page)
    db.query('SELECT * FROM orders WHERE order_id = ?', [orderId], (err, results) => {
      if (err) {
        return res.status(500).json();
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Updated order not found, which is unexpected.' });
      }
      const order = results[0];

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
        qr: order.qr_code, // still the deep-link URL
      };
      res.json(mappedOrder);
    });
  });
});

// Export the app for Vercel Serverless
module.exports = app;

// Only listen if running locally
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
