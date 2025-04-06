const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: '',
  database: 'bakerysystem',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  const { username, password, name, email, mobilenumber } = req.body;

  try {
    // Check if username exists
    const [userExists] = await pool.promise().query(
      'SELECT username FROM users WHERE username = ?', 
      [username]
    );

    if (userExists.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Insert new user (plain text password)
    await pool.promise().query(
      'INSERT INTO users (username, password, name, email, mobilenumber) VALUES (?, ?, ?, ?, ?)',
      [username, password, name, email, mobilenumber]
    );

    res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Signin endpoint
app.post('/api/signin', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const [users] = await pool.promise().query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Return user data (excluding password)
    const user = users[0];
    const { password: _, ...userData } = user;
    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Submit feedback
app.post('/api/feedback', async (req, res) => {
    try {
      const { username, feedbacktext } = req.body;
  
      // Input validation
      if (!username || !feedbacktext) {
        return res.status(400).json({ error: "Username and feedback text are required" });
      }
  
      const [result] = await pool.promise().query(
        'INSERT INTO feedback (username, feedbacktext) VALUES (?, ?)',
        [username, feedbacktext]
      );
  
      res.json({ 
        success: true, 
        feedbackId: result.insertId,
        message: 'Feedback submitted successfully'
      });
  
    } catch (error) {
      console.error('Feedback error:', error);
      res.status(500).json({ error: "Internal server error" }); // Must return JSON
    }
  });
  
  // Get all feedback
  app.get('/api/feedback', async (req, res) => {
    try {
      const [feedbacks] = await pool.promise().query(
        'SELECT feedbackid, username, feedbacktext, created_at FROM feedback ORDER BY created_at DESC'
      );
  
      res.json({ success: true, feedbacks });
    } catch (error) {
      console.error('Fetch feedback error:', error);
      res.status(500).json({ error: 'Failed to fetch feedback' });
    }
  });


  app.post('/api/orders', async (req, res) => {
    try {
      const { username, email, shipping_address, total_amount, items } = req.body;
      
      // Basic validation
      if (!username || !email || !shipping_address || !total_amount || !items) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      const [result] = await pool.promise().query(
        `INSERT INTO orders 
         (username, email, shipping_address, total_amount, items, order_status) 
         VALUES (?, ?, ?, ?, ?, 'payment pending')`,
        [username, email, shipping_address, total_amount, JSON.stringify(items)]
      );
  
      res.status(201).json({
        success: true,
        order_id: result.insertId,
        message: 'Order placed successfully'
      });
  
    } catch (error) {
      console.error('Order placement error:', error);
      res.status(500).json({ error: 'Failed to place order' });
    }
  });
  
  // Get all orders (for admin)
  app.get('/api/orders', async (req, res) => {
    try {
      const [orders] = await pool.promise().query(
        `SELECT 
          order_id,
          username,
          email,
          shipping_address,
          total_amount,
          order_status,
          order_date,
          items
         FROM orders
         ORDER BY order_date DESC`
      );
  
      // Parse JSON items
      const parsedOrders = orders.map(order => ({
        ...order,
        items: JSON.parse(order.items)
      }));
  
      res.json({ success: true, orders: parsedOrders });
  
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });
  
  // Get orders for a specific user
  app.get('/api/orders/:username', async (req, res) => {
    try {
      const { username } = req.params;
      
      const [orders] = await pool.promise().query(
        `SELECT 
          order_id,
          email,
          shipping_address,
          total_amount,
          order_status,
          order_date,
          items
         FROM orders
         WHERE username = ?
         ORDER BY order_date DESC`,
        [username]
      );
  
      // Parse JSON items
      const parsedOrders = orders.map(order => ({
        ...order,
        items: JSON.parse(order.items)
      }));
  
      res.json({ success: true, orders: parsedOrders });
  
    } catch (error) {
      console.error('Get user orders error:', error);
      res.status(500).json({ error: 'Failed to fetch user orders' });
    }
  });
  
  // Update order status
  app.patch('/api/orders/:order_id', async (req, res) => {
    try {
      const { order_id } = req.params;
      const { order_status } = req.body;
  
      if (!['payment pending', 'confirmed', 'shipped', 'rejected'].includes(order_status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
  
      const [result] = await pool.promise().query(
        `UPDATE orders 
         SET order_status = ? 
         WHERE order_id = ?`,
        [order_status, order_id]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
      res.json({ 
        success: true,
        message: 'Order status updated'
      });
  
    } catch (error) {
      console.error('Update order error:', error);
      res.status(500).json({ error: 'Failed to update order' });
    }
  });

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});