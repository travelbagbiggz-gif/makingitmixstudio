// ============================================
// MakingItMixProStudio - Backend Server
// Replaces Supabase with self-hosted Express + PostgreSQL
// ============================================

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';
import Stripe from 'stripe';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// PostgreSQL connection
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'makingitmixstudio',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3002' }));
app.use(express.json());

// File upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = `./uploads/${req.userId}`;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

// Serve uploaded files
app.use('/uploads', express.static('./uploads'));

// ============================================
// AUTH MIDDLEWARE
// ============================================
const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const result = await pool.query(
      'SELECT user_id FROM user_sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    if (!result.rows[0]) return res.status(401).json({ error: 'Invalid or expired token' });
    req.userId = result.rows[0].user_id;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Auth error' });
  }
};

// ============================================
// AUTH ROUTES
// ============================================

// Sign Up
app.post('/auth/signup', async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const existing = await pool.query('SELECT id FROM user_profiles WHERE email = $1', [email]);
    if (existing.rows[0]) return res.status(400).json({ error: 'Email already in use' });

    const password_hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await pool.query(
      'INSERT INTO user_profiles (id, email, password_hash, full_name) VALUES ($1, $2, $3, $4)',
      [userId, email.toLowerCase(), password_hash, full_name || email.split('@')[0]]
    );

    const token = uuidv4();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await pool.query(
      'INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expires]
    );

    const user = await pool.query('SELECT id, email, full_name, role, demos_used, subscription_status FROM user_profiles WHERE id = $1', [userId]);
    res.json({ token, user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Sign In
app.post('/auth/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await pool.query('SELECT * FROM user_profiles WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = uuidv4();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expires]
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        demos_used: user.demos_used,
        subscription_status: user.subscription_status,
        subscription_expires_at: user.subscription_expires_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Sign in failed' });
  }
});

// Sign Out
app.post('/auth/signout', requireAuth, async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  await pool.query('DELETE FROM user_sessions WHERE token = $1', [token]);
  res.json({ success: true });
});

// Get current user
app.get('/auth/me', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT id, email, full_name, role, demos_used, subscription_status, subscription_expires_at, avatar_url FROM user_profiles WHERE id = $1',
    [req.userId]
  );
  res.json({ user: result.rows[0] });
});

// ============================================
// AUDIO SESSIONS ROUTES
// ============================================

// Get all sessions for user
app.get('/sessions', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM audio_sessions WHERE user_id = $1 ORDER BY created_at DESC',
    [req.userId]
  );
  res.json({ data: result.rows });
});

// Create session
app.post('/sessions', requireAuth, async (req, res) => {
  const { title, description, preset, autotune_enabled, retune_speed } = req.body;
  const result = await pool.query(
    'INSERT INTO audio_sessions (user_id, title, description, preset, autotune_enabled, retune_speed) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [req.userId, title, description, preset || 'hiphop', autotune_enabled ?? true, retune_speed || 50]
  );
  res.json({ data: result.rows[0] });
});

// Update session
app.put('/sessions/:id', requireAuth, async (req, res) => {
  const { title, description, status, preset, autotune_enabled, retune_speed, session_data } = req.body;
  const result = await pool.query(
    `UPDATE audio_sessions SET title=$1, description=$2, status=$3, preset=$4, 
     autotune_enabled=$5, retune_speed=$6, session_data=$7, updated_at=NOW()
     WHERE id=$8 AND user_id=$9 RETURNING *`,
    [title, description, status, preset, autotune_enabled, retune_speed, session_data, req.params.id, req.userId]
  );
  res.json({ data: result.rows[0] });
});

// Delete session
app.delete('/sessions/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM audio_sessions WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
  res.json({ success: true });
});

// ============================================
// FILE UPLOAD ROUTES
// ============================================

app.post('/upload/audio', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const filePath = `/uploads/${req.userId}/${req.file.filename}`;
  res.json({ path: filePath, url: `${process.env.API_URL}${filePath}` });
});

// ============================================
// STRIPE ROUTES
// ============================================

// Create checkout session
app.post('/stripe/checkout', requireAuth, async (req, res) => {
  const { priceId } = req.body;
  const user = await pool.query('SELECT * FROM user_profiles WHERE id=$1', [req.userId]);
  const u = user.rows[0];

  let customerId = u.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: u.email });
    customerId = customer.id;
    await pool.query('UPDATE user_profiles SET stripe_customer_id=$1 WHERE id=$2', [customerId, req.userId]);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing`,
  });

  res.json({ url: session.url });
});

// Stripe webhook
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: 'Webhook error' });
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const sub = event.data.object;
    await pool.query(
      `UPDATE user_profiles SET stripe_subscription_id=$1, subscription_status=$2, 
       subscription_price_id=$3, subscription_expires_at=$4, role='premium', updated_at=NOW()
       WHERE stripe_customer_id=$5`,
      [sub.id, sub.status, sub.items.data[0].price.id, new Date(sub.current_period_end * 1000), sub.customer]
    );
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    await pool.query(
      `UPDATE user_profiles SET subscription_status='inactive', role='free', updated_at=NOW()
       WHERE stripe_customer_id=$1`,
      [sub.customer]
    );
  }

  res.json({ received: true });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
