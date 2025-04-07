const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
// In your server.js
const { generateRevenueReportPDF } = require('./pdfGenerator');
const path = require('path');
const fs = require('fs');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
}

// PDF Generation Endpoint

// PDF Generation Endpoint



// Email configuration (add this near your DB config)


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

const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email provider
    auth: {
      user: 'amirhashmi017@gmail.com', // your business email
      pass: 'pzcn hvul syyz gaka' // use app-specific password for security
    }
  });
  
  // Email sending function (add this helper function)
  async function sendOrderConfirmationEmail(email, orderId) {
    try {
      const mailOptions = {
        from: 'Sweet Byte Bakers',
        to: email,
        subject: 'Sweet Byte Bakers - Order Confirmation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e67e22;">Thank You for Your Order!</h2>
            <p>Your order <strong>#${orderId}</strong> has been placed successfully.</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #e67e22;">Next Steps:</h4>
              <ol>
                <li>Pay via JazzCash to <strong>0321-1234567</strong></li>
                <li>Send payment screenshot to <strong>0321-9876543</strong> on WhatsApp</li>
                <li>Track your order on our website</li>
              </ol>
            </div>
            
            <p>We'll notify you when your order ships. For any questions, reply to this email.</p>
            
            <div style="margin-top: 30px; text-align: center;">
              <img src="https://your-website.com/logo.png" alt="Sweet Byte Bakers" style="max-width: 200px;">
              <p style="color: #888; font-size: 12px;">Sweet Byte Bakers © ${new Date().getFullYear()}</p>
            </div>
          </div>
        `
      };
  
      await transporter.sendMail(mailOptions);
      console.log('Email sent to:', email);
    } catch (error) {
      console.error('Email sending error:', error);
    }
  }

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

app.post('/api/reports/generate-pdf', async (req, res) => {
    try {
        const reportData = req.body;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `revenue-report-${timestamp}.pdf`;
        const filePath = path.join(reportsDir, filename);
        
        await generateRevenueReportPDF(reportData, filePath);
        
        res.json({ 
            success: true,
            filename
        });
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// PDF Download Endpoint
app.get('/api/reports/download-pdf', (req, res) => {
    const { filename } = req.query;
    const filePath = path.join(reportsDir, filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath, `SweetByteBakers-${filename}`, (err) => {
        if (err) {
            console.error('Download error:', err);
        }
        // Optionally delete the file after download
        // fs.unlinkSync(filePath);
    });
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
        'SELECT feedbackid, username, feedbacktext FROM feedback'
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
  
      sendOrderConfirmationEmail(email, result.insertId)
      .catch(emailError => {
        console.error('Email failed to send:', emailError);
        // Don't fail the request if email fails
      });

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
  
  // Report API Endpoints
// Report API Endpoints
app.get('/api/reports/revenue', async (req, res) => {
    try {
        const { timeframe } = req.query;
        
        // Validate timeframe
        const validTimeframes = ['1month', '2months', '6months', '1year'];
        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ error: 'Invalid timeframe' });
        }

        // Calculate date range
        const dateRange = calculateDateRange(timeframe);
        
        // Get revenue data
        const [results] = await pool.promise().query(
            `SELECT 
                DATE_FORMAT(order_date, '%Y-%m') AS month,
                COUNT(order_id) AS order_count,
                SUM(total_amount) AS total_revenue,
                AVG(total_amount) AS average_order_value
             FROM orders
             WHERE order_date >= ? AND order_status != 'rejected'
             GROUP BY DATE_FORMAT(order_date, '%Y-%m')
             ORDER BY month DESC`,
            [dateRange.startDate]
        );

        // Get all orders in the timeframe first
        const [allOrders] = await pool.promise().query(
            `SELECT items FROM orders 
             WHERE order_date >= ? AND order_status != 'rejected'`,
            [dateRange.startDate]
        );

        // Process items in JavaScript instead of SQL
        const productMap = new Map();
        
        allOrders.forEach(order => {
            const items = JSON.parse(order.items);
            items.forEach(item => {
                const existing = productMap.get(item.name) || {
                    name: item.name,
                    total_quantity: 0,
                    total_revenue: 0
                };
                existing.total_quantity += item.quantity;
                existing.total_revenue += item.price * item.quantity;
                productMap.set(item.name, existing);
            });
        });

        // Convert to array and sort by revenue
        const topProducts = Array.from(productMap.values())
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, 5);

        res.json({
            success: true,
            timeframe,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            revenueData: results,
            topProducts,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Helper function to calculate date ranges
function calculateDateRange(timeframe) {
    const endDate = new Date();
    let startDate = new Date();
    
    switch(timeframe) {
        case '1month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case '2months':
            startDate.setMonth(startDate.getMonth() - 2);
            break;
        case '6months':
            startDate.setMonth(startDate.getMonth() - 6);
            break;
        case '1year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
    }
    
    return { startDate, endDate };
}

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