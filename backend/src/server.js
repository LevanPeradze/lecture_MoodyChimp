require('dotenv').config();
// Also load .env.local if it exists (in backend directory)
const path = require('path');
const fs = require('fs');
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath });
}
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 4000;

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  try {
    // Cloudinary can parse the URL directly
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_URL.match(/@([^.]+)/)?.[1] || 'dtewb8gij',
      api_key: process.env.CLOUDINARY_URL.match(/:\/\/([^:]+):/)?.[1] || '942843772345576',
      api_secret: process.env.CLOUDINARY_URL.match(/:\/\/([^:]+):([^@]+)@/)?.[2] || 'cTIVy64rftIJhE5BNTlNRpRcVS4'
    });
    console.log('Cloudinary configured successfully');
    console.log('Cloud name:', cloudinary.config().cloud_name);
  } catch (error) {
    console.error('Failed to configure Cloudinary:', error);
  }
} else {
  console.warn('CLOUDINARY_URL not found in environment variables');
}

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Enable JSON parsing and CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Allow Vercel deployments
    if (origin.includes('vercel.app') || origin.includes('vercel.com')) {
      return callback(null, true);
    }

    // Allow all origins in production (you can restrict this if needed)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increase limit to handle base64 image data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('Database connected successfully'))
  .catch(err => {
    console.error('Database connection error:', err.message);
    console.error('Make sure DATABASE_URL is set in .env file');
  });

// Initialize users table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    avatar_url TEXT,
    title VARCHAR(100),
    color_theme VARCHAR(50) DEFAULT 'default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating table:', err));

// Add profile columns to users table if they don't exist (for existing databases)
pool.query(`
  DO $$ 
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
      ALTER TABLE users ADD COLUMN username VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
      ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='title') THEN
      ALTER TABLE users ADD COLUMN title VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='color_theme') THEN
      ALTER TABLE users ADD COLUMN color_theme VARCHAR(50) DEFAULT 'default';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
      ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='achievements') THEN
      ALTER TABLE users ADD COLUMN achievements JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='achievement_discount_granted') THEN
      ALTER TABLE users ADD COLUMN achievement_discount_granted BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='achievement_discount_available') THEN
      ALTER TABLE users ADD COLUMN achievement_discount_available BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='banana_clicks') THEN
      ALTER TABLE users ADD COLUMN banana_clicks INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_achievement_reminder_sent') THEN
      ALTER TABLE users ADD COLUMN last_achievement_reminder_sent TIMESTAMP;
    END IF;
  END $$;
`).catch(err => console.error('Error adding columns to users table:', err));

// Initialize user_profiles table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) UNIQUE NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    username VARCHAR(255),
    avatar_url TEXT,
    title VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating user_profiles table:', err));

// Update avatar_url column to TEXT if it exists as VARCHAR
pool.query(`
  DO $$ 
  BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='avatar_url' AND data_type='character varying') THEN
      ALTER TABLE user_profiles ALTER COLUMN avatar_url TYPE TEXT;
    END IF;
  END $$;
`).catch(err => console.error('Error updating avatar_url column:', err));

// Initialize services table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating services table:', err));

// Initialize Course_Service table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS Course_Service (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    level VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    illustration VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating Course_Service table:', err));

// Initialize service_details table for comprehensive service information
pool.query(`
  CREATE TABLE IF NOT EXISTS service_details (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    banner_image_url TEXT,
    full_description TEXT,
    difficulty_level VARCHAR(50),
    estimated_duration VARCHAR(100),
    what_youll_learn TEXT,
    requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_id)
  )
`).catch(err => console.error('Error creating service_details table:', err));

// Initialize course_details table for comprehensive course information
pool.query(`
  CREATE TABLE IF NOT EXISTS course_details (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES Course_Service(id) ON DELETE CASCADE,
    banner_image_url TEXT,
    thumbnail_image_url TEXT,
    full_description TEXT,
    what_youll_learn TEXT,
    course_outline TEXT,
    prerequisites TEXT,
    estimated_duration VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id)
  )
`).catch(err => console.error('Error creating course_details table:', err));

// Add thumbnail_image_url column if it doesn't exist
pool.query(`
  ALTER TABLE course_details 
  ADD COLUMN IF NOT EXISTS thumbnail_image_url TEXT
`).catch(err => {
  // Ignore error if column already exists
  if (!err.message.includes('duplicate column')) {
    console.error('Error adding thumbnail_image_url column:', err);
  }
});

// Initialize reviews table for ratings and comments
pool.query(`
  CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    item_id INTEGER NOT NULL,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('course', 'service')),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating reviews table:', err));

// Initialize orders table for service orders
pool.query(`
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    service_title VARCHAR(255) NOT NULL,
    order_details JSONB,
    total_price DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending',
    delivery_time VARCHAR(100),
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating orders table:', err));

// Initialize questionare table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS questionare (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    q1 VARCHAR(100),
    q2 TEXT,
    q3 TEXT,
    q4 VARCHAR(100),
    q5 VARCHAR(100),
    q6 VARCHAR(100),
    q7 VARCHAR(100),
    q8 TEXT,
    q9 VARCHAR(100),
    q10 VARCHAR(100),
    q11 VARCHAR(100),
    q12 VARCHAR(100),
    q13 VARCHAR(100),
    q14 VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating questionare table:', err));

// Initialize optimal table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS optimal (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    questionare_id INTEGER REFERENCES questionare(id),
    optimal_course VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating optimal table:', err));

// Initialize user_notes table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS user_notes (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating user_notes table:', err));

// Initialize saved_courses table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS saved_courses (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    course_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_email, course_id)
  )
`).catch(err => console.error('Error creating saved_courses table:', err));

// Initialize admin table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{
      "user_management": true,
      "content_management": true,
      "dashboard": true,
      "settings": true
    }'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating admins table:', err));

// Insert default admin user if they don't exist
const insertDefaultAdmin = async () => {
  try {
    // Get user with id 10
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE id = $1',
      [10]
    );

    if (userResult.rows.length === 0) {
      console.log('Warning: User with id 10 does not exist in users table.');
      return;
    }

    const user = userResult.rows[0];
    const userEmail = user.email;

    // Check if admin already exists for this user
    const existing = await pool.query(
      'SELECT id FROM admins WHERE email = $1',
      [userEmail]
    );

    if (existing.rows.length === 0) {
      // Insert admin with all permissions
      await pool.query(
        `INSERT INTO admins (email, permissions) 
         VALUES ($1, $2::jsonb)`,
        [
          userEmail,
          JSON.stringify({
            user_management: true,
            content_management: true,
            dashboard: true,
            settings: true
          })
        ]
      );
      console.log(`Admin user (id: 10, email: ${userEmail}) added successfully`);
    } else {
      console.log(`Admin user (id: 10, email: ${userEmail}) already exists`);
    }
  } catch (err) {
    console.error('Error inserting admin user:', err);
  }
};

// Insert default services if they don't exist
const insertDefaultServices = async () => {
  const services = [
    // Storyboards
    { category: 'Storyboards', title: 'Concept Storyboard', description: 'Initial visual planning for your narrative', price: 'Starting at $150' },
    { category: 'Storyboards', title: 'Animatic Storyboard', description: 'Timed storyboard with basic motion', price: 'Starting at $300' },
    { category: 'Storyboards', title: 'Production Storyboard', description: 'Detailed storyboard for production use', price: 'Starting at $500' },
    // Book design
    { category: 'Book design', title: 'Cover Design', description: 'Custom book cover design', price: 'Starting at $200' },
    { category: 'Book design', title: 'Interior Layout', description: 'Professional page layout and typography', price: 'Starting at $400' },
    { category: 'Book design', title: 'Complete Book Design', description: 'Full book design package', price: 'Starting at $800' },
    // Character design
    { category: 'Character design', title: 'Character Concept', description: 'Initial character design and exploration', price: 'Starting at $250' },
    { category: 'Character design', title: 'Character Sheet', description: 'Complete character reference sheet', price: 'Starting at $400' },
    { category: 'Character design', title: 'Character Turnaround', description: 'Multi-view character design', price: 'Starting at $600' },
    // Game Design
    { category: 'Game Design', title: 'Game Concept Document', description: 'Complete game design documentation', price: 'Starting at $500' },
    { category: 'Game Design', title: 'Level Design', description: 'Game level layout and mechanics', price: 'Starting at $700' },
    { category: 'Game Design', title: 'UI/UX Design', description: 'User interface and experience design', price: 'Starting at $600' },
  ];

  for (const service of services) {
    try {
      // Check if service already exists
      const existing = await pool.query(
        'SELECT id FROM services WHERE category = $1 AND title = $2',
        [service.category, service.title]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO services (category, title, description, price) VALUES ($1, $2, $3, $4)',
          [service.category, service.title, service.description, service.price]
        );
      }
    } catch (err) {
      console.error('Error inserting service:', err);
    }
  }
};

// Insert default course services (Learn services) if they don't exist
const insertDefaultCourseServices = async () => {
  const courseServices = [
    {
      title: 'Game Dev',
      level: 'for beginners',
      icon: '🎮',
      illustration: '🎮',
      details: {
        full_description: 'Learn the fundamentals of game development from scratch. This comprehensive course covers game design principles, programming basics, and hands-on project creation. Perfect for absolute beginners who want to create their first game.',
        what_youll_learn: '• Game design fundamentals and mechanics\n• Basic programming concepts for games\n• Unity or Godot engine basics\n• Creating your first playable game\n• Game asset integration\n• Debugging and optimization techniques',
        course_outline: 'Module 1: Introduction to Game Development\nModule 2: Game Design Basics\nModule 3: Programming Fundamentals\nModule 4: Game Engine Basics\nModule 5: Your First Game Project\nModule 6: Polish and Publishing',
        prerequisites: 'No prior experience required. Basic computer skills recommended.',
        estimated_duration: '8-12 weeks'
      }
    },
    {
      title: 'Animation',
      level: 'beginner-intermediate',
      icon: '🎬',
      illustration: '🎬',
      details: {
        full_description: 'Master the art of animation from keyframe planning to smooth motion. Learn traditional and digital animation techniques, timing, spacing, and character movement. Build a portfolio of animated sequences.',
        what_youll_learn: '• Principles of animation (squash & stretch, timing, etc.)\n• Keyframe planning and storyboarding\n• Character animation techniques\n• Motion graphics and effects\n• Animation software proficiency\n• Creating polished animation sequences',
        course_outline: 'Module 1: Animation Principles\nModule 2: Keyframe Planning\nModule 3: Character Animation\nModule 4: Motion Graphics\nModule 5: Advanced Techniques\nModule 6: Portfolio Development',
        prerequisites: 'Basic drawing skills helpful but not required.',
        estimated_duration: '10-14 weeks'
      }
    },
    {
      title: 'Simplifying the human figure',
      level: 'intermediate-advanced',
      icon: '✏️',
      illustration: '✏️',
      details: {
        full_description: 'Advanced course on drawing the human figure with simplified, powerful forms. Learn to break down complex anatomy into essential shapes, master proportions, and create dynamic figure drawings from imagination.',
        what_youll_learn: '• Human anatomy fundamentals\n• Simplification techniques\n• Gesture and movement\n• Proportions and measurements\n• Drawing from imagination\n• Style development and personal expression',
        course_outline: 'Module 1: Anatomy Basics\nModule 2: Simplification Methods\nModule 3: Gesture Drawing\nModule 4: Proportions Mastery\nModule 5: Dynamic Poses\nModule 6: Style Development',
        prerequisites: 'Intermediate drawing skills required. Basic understanding of human form recommended.',
        estimated_duration: '12-16 weeks'
      }
    },
  ];

  for (const course of courseServices) {
    try {
      // Check if course service already exists
      const existing = await pool.query(
        'SELECT id FROM Course_Service WHERE title = $1',
        [course.title]
      );

      let courseId;
      if (existing.rows.length === 0) {
        const result = await pool.query(
          'INSERT INTO Course_Service (title, level, icon, illustration) VALUES ($1, $2, $3, $4) RETURNING id',
          [course.title, course.level, course.icon, course.illustration]
        );
        courseId = result.rows[0].id;
        console.log(`Inserted course service: ${course.title}`);
      } else {
        courseId = existing.rows[0].id;
      }

      // Insert course details if they don't exist
      if (course.details) {
        const detailsExisting = await pool.query(
          'SELECT id FROM course_details WHERE course_id = $1',
          [courseId]
        );

        if (detailsExisting.rows.length === 0) {
          await pool.query(
            `INSERT INTO course_details (course_id, full_description, what_youll_learn, course_outline, prerequisites, estimated_duration) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              courseId,
              course.details.full_description,
              course.details.what_youll_learn,
              course.details.course_outline,
              course.details.prerequisites,
              course.details.estimated_duration
            ]
          );
          console.log(`Inserted course details for: ${course.title}`);
        }
      }
    } catch (err) {
      console.error('Error inserting course service:', err);
    }
  }
};

// Run after a short delay to ensure table is created
setTimeout(() => {
  insertDefaultServices().catch(err => console.error('Error inserting default services:', err));
  insertDefaultCourseServices().catch(err => console.error('Error inserting default course services:', err));
  insertDefaultAdmin().catch(err => console.error('Error inserting default admin:', err));
}, 1000);

// Simple in-memory placeholder data to avoid database usage for now.
const appInfo = {
  name: 'Learning Web App',
  version: '0.1.0',
  message: 'Welcome to your first full-stack project!'
};

// Root endpoint - helpful for testing
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'MoodyChimp Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      status: '/api/status',
      webhook: '/api/webhook/check-achievements'
    }
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    ...appInfo
  });
});

// Sign up endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Insert new user (in production, hash the password!)
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, password]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign in endpoint
app.post('/api/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists (case-insensitive email)
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Compare passwords (trim to handle any whitespace issues)
    if (user.password.trim() !== password.trim()) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user data endpoint
app.get('/api/user/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Get user data including profile fields from users table
    const userResult = await pool.query(
      'SELECT id, email, password, username, avatar_url, title, color_theme, achievements, achievement_discount_granted, achievement_discount_available, banana_clicks FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userResult.rows[0];
    // Ensure achievements is always an object
    if (userData.achievements) {
      if (typeof userData.achievements === 'string') {
        try {
          userData.achievements = JSON.parse(userData.achievements);
        } catch (e) {
          userData.achievements = {};
        }
      } else if (typeof userData.achievements !== 'object') {
        userData.achievements = {};
      }
    } else {
      userData.achievements = {};
    }

    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user account endpoint
app.delete('/api/user/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user (CASCADE will handle related records in other tables)
    await pool.query('DELETE FROM users WHERE email = $1', [email]);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile endpoint
app.post('/api/update-profile', async (req, res) => {
  try {
    const { email, username, avatar_url, title, color_theme } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update query for users table
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(avatar_url);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (color_theme !== undefined) {
      updates.push(`color_theme = $${paramCount++}`);
      values.push(color_theme);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add email as the last parameter for WHERE clause
    values.push(email);
    const emailParam = `$${paramCount}`;

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE email = ${emailParam} 
      RETURNING id, email, username, avatar_url, title, color_theme
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoints
// Check if user is admin
app.get('/api/admin/check/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const result = await pool.query(
      'SELECT id, email, permissions, created_at FROM admins WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, isAdmin: false });
    }

    const admin = result.rows[0];
    // Parse permissions if it's a string
    if (typeof admin.permissions === 'string') {
      try {
        admin.permissions = JSON.parse(admin.permissions);
      } catch (e) {
        admin.permissions = {};
      }
    }

    res.json({ success: true, isAdmin: true, admin });
  } catch (error) {
    console.error('Check admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin permissions
app.get('/api/admin/permissions/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const result = await pool.query(
      'SELECT permissions FROM admins WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    let permissions = result.rows[0].permissions;
    // Parse permissions if it's a string
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch (e) {
        permissions = {};
      }
    }

    res.json({ success: true, permissions });
  } catch (error) {
    console.error('Get admin permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update admin permissions (for future use)
app.put('/api/admin/permissions/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ error: 'Invalid permissions object' });
    }

    const result = await pool.query(
      `UPDATE admins 
       SET permissions = $1::jsonb, updated_at = CURRENT_TIMESTAMP 
       WHERE email = $2 
       RETURNING id, email, permissions`,
      [JSON.stringify(permissions), email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    let updatedPermissions = result.rows[0].permissions;
    if (typeof updatedPermissions === 'string') {
      try {
        updatedPermissions = JSON.parse(updatedPermissions);
      } catch (e) {
        updatedPermissions = {};
      }
    }

    res.json({ success: true, permissions: updatedPermissions });
  } catch (error) {
    console.error('Update admin permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== ADMIN PANEL API ENDPOINTS ==========

// Get all users (admin only)
app.get('/api/admin/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, username, avatar_url, title, color_theme, created_at, 
       (SELECT COUNT(*) FROM orders WHERE orders.user_email = users.email) as order_count,
       (SELECT COUNT(*) FROM course_enrollments WHERE course_enrollments.user_email = users.email) as enrollment_count
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin only)
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, title, avatar_url, color_theme, password } = req.body;

    console.log('Admin updating user:', { id, username, title, avatar_url, color_theme, hasPassword: !!password });

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(avatar_url);
    }
    if (color_theme !== undefined) {
      // Always update color_theme if it's provided, even if it's the default
      const themeValue = color_theme || 'default';
      updates.push(`color_theme = $${paramCount++}`);
      values.push(themeValue);
      console.log('Updating color_theme to:', themeValue);
    }
    if (password !== undefined && password !== null && password !== '') {
      // Update password (in production, hash the password!)
      updates.push(`password = $${paramCount++}`);
      values.push(password);
      console.log('Updating password for user:', id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, email, username, avatar_url, title, color_theme, created_at
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = result.rows[0];
    console.log('User updated:', { id: updatedUser.id, email: updatedUser.email, color_theme: updatedUser.color_theme });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, email', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all services for admin (including courses)
app.get('/api/admin/services', async (req, res) => {
  try {
    const servicesResult = await pool.query(
      'SELECT id, category, title, description, price, created_at FROM services ORDER BY category, id'
    );

    const coursesResult = await pool.query(
      `SELECT cs.id, cs.title, cs.level, cs.icon, cs.illustration, cs.created_at, 
              cd.banner_image_url, cd.thumbnail_image_url
       FROM Course_Service cs
       LEFT JOIN course_details cd ON cs.id = cd.course_id
       ORDER BY cs.id`
    );

    res.json({
      success: true,
      services: servicesResult.rows.map(s => ({ ...s, type: 'service' })),
      courses: coursesResult.rows.map(c => ({ ...c, type: 'course' }))
    });
  } catch (error) {
    console.error('Get admin services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update service (admin only)
app.put('/api/admin/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, description, price } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const updateQuery = `
      UPDATE services 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, category, title, description, price, created_at
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ success: true, service: result.rows[0] });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete service (admin only)
app.delete('/api/admin/services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING id, title', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new service (admin only)
app.post('/api/admin/services', async (req, res) => {
  try {
    const { category, title, description, price } = req.body;

    if (!category || !title) {
      return res.status(400).json({ error: 'Category and title are required' });
    }

    const result = await pool.query(
      'INSERT INTO services (category, title, description, price) VALUES ($1, $2, $3, $4) RETURNING id, category, title, description, price, created_at',
      [category, title, description || null, price || null]
    );

    res.json({ success: true, service: result.rows[0] });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload image to Cloudinary (admin only)
app.post('/api/admin/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('No file received in upload request');
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('Received file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Convert buffer to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    console.log('Uploading to Cloudinary...');
    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: 'lecture_project/courses',
      resource_type: 'image'
    });

    console.log('Cloudinary upload successful:', uploadResult.secure_url);

    res.json({
      success: true,
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    });
  } catch (error) {
    console.error('Image upload error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to upload image: ' + error.message });
  }
});

// Update course (admin only)
app.put('/api/admin/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, level, icon, illustration, banner_image_url, thumbnail_image_url } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (level !== undefined) {
      updates.push(`level = $${paramCount++}`);
      values.push(level);
    }
    if (icon !== undefined) {
      updates.push(`icon = $${paramCount++}`);
      values.push(icon);
    }
    if (illustration !== undefined) {
      updates.push(`illustration = $${paramCount++}`);
      values.push(illustration);
    }

    if (updates.length > 0) {
      values.push(id);
      const updateQuery = `
        UPDATE Course_Service 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, title, level, icon, illustration, created_at
      `;

      await pool.query(updateQuery, values);
    }

    // Update course_details banner_image_url and/or thumbnail_image_url if provided
    if (banner_image_url !== undefined || thumbnail_image_url !== undefined) {
      // Check if course_details exists for this course
      const detailsCheck = await pool.query(
        'SELECT id FROM course_details WHERE course_id = $1',
        [id]
      );

      if (detailsCheck.rows.length > 0) {
        // Update existing course_details
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (banner_image_url !== undefined) {
          updates.push(`banner_image_url = $${paramCount++}`);
          values.push(banner_image_url);
        }
        if (thumbnail_image_url !== undefined) {
          updates.push(`thumbnail_image_url = $${paramCount++}`);
          values.push(thumbnail_image_url);
        }

        if (updates.length > 0) {
          updates.push(`updated_at = CURRENT_TIMESTAMP`);
          values.push(id);
          await pool.query(
            `UPDATE course_details SET ${updates.join(', ')} WHERE course_id = $${paramCount}`,
            values
          );
        }
      } else {
        // Create new course_details entry
        await pool.query(
          'INSERT INTO course_details (course_id, banner_image_url, thumbnail_image_url) VALUES ($1, $2, $3)',
          [id, banner_image_url || null, thumbnail_image_url || null]
        );
      }
    }

    // Fetch updated course
    const courseResult = await pool.query(
      'SELECT id, title, level, icon, illustration, created_at FROM Course_Service WHERE id = $1',
      [id]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Fetch course_details
    const detailsResult = await pool.query(
      'SELECT banner_image_url, thumbnail_image_url FROM course_details WHERE course_id = $1',
      [id]
    );

    const course = courseResult.rows[0];
    if (detailsResult.rows.length > 0) {
      course.banner_image_url = detailsResult.rows[0].banner_image_url;
      course.thumbnail_image_url = detailsResult.rows[0].thumbnail_image_url;
    }

    res.json({ success: true, course });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create notifications table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    title VARCHAR(255),
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'message',
    sender_email VARCHAR(255) REFERENCES users(email) ON DELETE SET NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating notifications table:', err));

// Add sender_email column if it doesn't exist (for existing tables)
pool.query(`
  ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS sender_email VARCHAR(255) REFERENCES users(email) ON DELETE SET NULL
`).catch(err => {
  // Ignore error if column already exists
  if (!err.message.includes('duplicate column')) {
    console.error('Error adding sender_email column:', err);
  }
});

// Create settings table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating site_settings table:', err));

// Insert default settings if they don't exist
pool.query(`
  INSERT INTO site_settings (setting_key, setting_value)
  VALUES 
    ('site_name', 'MOODYCHIMP'),
    ('tagline', 'CREATIVE STUDIO / GLOBAL'),
    ('email_notifications', 'true'),
    ('push_notifications', 'false')
  ON CONFLICT (setting_key) DO NOTHING
`).catch(err => console.error('Error inserting default settings:', err));

// Get site settings (admin only)
app.get('/api/admin/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT setting_key, setting_value FROM site_settings');

    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update site settings (admin only)
app.put('/api/admin/settings', async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings object' });
    }

    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO site_settings (setting_key, setting_value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP`,
        [key, String(value)]
      );
    }

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message/notification to user (admin only)
app.post('/api/admin/send-message', async (req, res) => {
  try {
    const { userEmail, title, message, senderEmail } = req.body;

    if (!userEmail || !message) {
      return res.status(400).json({ error: 'User email and message are required' });
    }

    if (!senderEmail) {
      return res.status(400).json({ error: 'Sender email is required' });
    }

    // Verify recipient user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Insert notification into database with sender email
    const result = await pool.query(
      `INSERT INTO notifications (user_email, title, message, type, sender_email, read)
       VALUES ($1, $2, $3, 'message', $4, FALSE)
       RETURNING id, user_email, title, message, type, sender_email, read, created_at`,
      [userEmail, title || null, message, senderEmail]
    );

    const notification = result.rows[0];
    console.log('Message sent to user:', { userEmail, title, senderEmail, notificationId: notification.id });

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user notifications
app.get('/api/notifications/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;

    const result = await pool.query(
      `SELECT n.id, n.title, n.message, n.type, n.read, n.created_at, n.sender_email,
              u.username as sender_username, u.email as sender_email_full
       FROM notifications n
       LEFT JOIN users u ON n.sender_email = u.email
       WHERE n.user_email = $1 
       ORDER BY n.created_at DESC`,
      [userEmail]
    );

    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE notifications 
       SET read = TRUE 
       WHERE id = $1 
       RETURNING id, read`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true, notification: result.rows[0] });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete all notifications for a user
app.delete('/api/notifications/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const result = await pool.query(
      'DELETE FROM notifications WHERE user_email = $1',
      [userEmail]
    );

    res.json({ success: true, message: 'All notifications deleted successfully' });
  } catch (error) {
    console.error('Delete notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify password endpoint
app.post('/api/verify-password', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // First, get the user by email (case-insensitive)
    const userResult = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);

    if (userResult.rows.length === 0) {
      console.error('User not found for email:', email);
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const user = userResult.rows[0];

    // Compare passwords (trim to handle any whitespace issues)
    if (user.password.trim() !== password.trim()) {
      console.error('Password mismatch for email:', email);
      return res.status(401).json({ error: 'Incorrect password' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all services endpoint
app.get('/api/services', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services ORDER BY category, id');

    res.json({ success: true, services: result.rows });
  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get service details by ID endpoint (must come before /:category to avoid route conflicts)
app.get('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const serviceId = parseInt(id, 10);

    // Check if id is numeric (service ID)
    if (isNaN(serviceId)) {
      return res.status(404).json({ success: false, error: 'Invalid service ID' });
    }

    // Get service basic info
    const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [serviceId]);

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const service = serviceResult.rows[0];

    // Get service details if they exist
    const detailsResult = await pool.query(
      'SELECT * FROM service_details WHERE service_id = $1',
      [serviceId]
    );

    // Merge service and details
    const serviceData = {
      ...service,
      details: detailsResult.rows[0] || null
    };

    return res.json({ success: true, service: serviceData });
  } catch (error) {
    console.error('Get service details error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get services by category endpoint
app.get('/api/services/category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    const result = await pool.query(
      'SELECT * FROM services WHERE category = $1 ORDER BY id',
      [category]
    );

    res.json({ success: true, services: result.rows });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all course services (Learn services) endpoint
app.get('/api/course-services', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cs.*, cd.banner_image_url, cd.thumbnail_image_url
      FROM Course_Service cs
      LEFT JOIN course_details cd ON cs.id = cd.course_id
      ORDER BY cs.id
    `);

    res.json({ success: true, services: result.rows });
  } catch (error) {
    console.error('Get course services error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get course details by ID endpoint
app.get('/api/course-services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get course basic info
    const courseResult = await pool.query('SELECT * FROM Course_Service WHERE id = $1', [id]);

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseResult.rows[0];

    // Get course details if they exist
    const detailsResult = await pool.query(
      'SELECT * FROM course_details WHERE course_id = $1',
      [id]
    );

    // Merge course and details
    const courseData = {
      ...course,
      details: detailsResult.rows[0] || null
    };

    res.json({ success: true, course: courseData });
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order endpoint
app.post('/api/orders', async (req, res) => {
  try {
    const { userEmail, serviceId, serviceTitle, orderDetails, totalPrice, deliveryTime, specialInstructions } = req.body;

    if (!userEmail || !serviceId || !serviceTitle) {
      return res.status(400).json({ error: 'User email, service ID, and service title are required' });
    }

    const result = await pool.query(
      `INSERT INTO orders (user_email, service_id, service_title, order_details, total_price, delivery_time, special_instructions, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') 
       RETURNING id, created_at, status`,
      [
        userEmail,
        serviceId,
        serviceTitle,
        JSON.stringify(orderDetails || {}),
        totalPrice || null,
        deliveryTime || null,
        specialInstructions || null
      ]
    );

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user orders endpoint
app.get('/api/orders/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const result = await pool.query(
      'SELECT * FROM orders WHERE user_email = $1 ORDER BY created_at DESC',
      [email]
    );

    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create course enrollment endpoint
app.post('/api/course-enrollments', async (req, res) => {
  try {
    const { userEmail, courseId, courseTitle, totalPrice } = req.body;

    if (!userEmail || !courseId || !courseTitle || !totalPrice) {
      return res.status(400).json({ error: 'User email, course ID, course title, and total price are required' });
    }

    const result = await pool.query(
      `INSERT INTO course_enrollments (user_email, course_id, course_title, total_price, status) 
       VALUES ($1, $2, $3, $4, 'enrolled') 
       RETURNING id, enrollment_date, status`,
      [userEmail, courseId, courseTitle, totalPrice]
    );

    res.json({ success: true, enrollment: result.rows[0] });
  } catch (error) {
    console.error('Create course enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user course enrollments endpoint
app.get('/api/course-enrollments/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const result = await pool.query(
      'SELECT * FROM course_enrollments WHERE user_email = $1 ORDER BY created_at DESC',
      [email]
    );

    res.json({ success: true, enrollments: result.rows });
  } catch (error) {
    console.error('Get course enrollments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reviews for an item endpoint
app.get('/api/reviews/:itemType/:itemId', async (req, res) => {
  try {
    const { itemType, itemId } = req.params;

    if (!['course', 'service'].includes(itemType)) {
      return res.status(400).json({ error: 'Invalid item type. Must be "course" or "service"' });
    }

    const result = await pool.query(
      'SELECT * FROM reviews WHERE item_type = $1 AND item_id = $2 ORDER BY created_at DESC',
      [itemType, itemId]
    );

    // Calculate average rating
    const avgRating = result.rows.length > 0
      ? result.rows.reduce((sum, review) => sum + review.rating, 0) / result.rows.length
      : 0;

    res.json({
      success: true,
      reviews: result.rows,
      averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
      totalReviews: result.rows.length
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit review endpoint
app.post('/api/reviews', async (req, res) => {
  try {
    const { userEmail, itemId, itemType, rating, comment } = req.body;

    if (!userEmail || !itemId || !itemType || !rating) {
      return res.status(400).json({ error: 'User email, item ID, item type, and rating are required' });
    }

    if (!['course', 'service'].includes(itemType)) {
      return res.status(400).json({ error: 'Invalid item type. Must be "course" or "service"' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user already reviewed this item
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE user_email = $1 AND item_id = $2 AND item_type = $3',
      [userEmail, itemId, itemType]
    );

    if (existingReview.rows.length > 0) {
      // Update existing review
      const result = await pool.query(
        `UPDATE reviews 
         SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE user_email = $3 AND item_id = $4 AND item_type = $5 
         RETURNING *`,
        [rating, comment || null, userEmail, itemId, itemType]
      );

      return res.json({ success: true, review: result.rows[0], updated: true });
    } else {
      // Create new review
      const result = await pool.query(
        `INSERT INTO reviews (user_email, item_id, item_type, rating, comment) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [userEmail, itemId, itemType, rating, comment || null]
      );

      return res.json({ success: true, review: result.rows[0], updated: false });
    }
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's optimal course endpoint
app.get('/api/user-optimal/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await pool.query(
      'SELECT optimal_course FROM optimal WHERE user_email = $1 ORDER BY created_at DESC LIMIT 1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, optimalCourse: null });
    }

    res.json({ success: true, optimalCourse: result.rows[0].optimal_course });
  } catch (error) {
    console.error('Get user optimal course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit questionnaire endpoint
app.post('/api/questionnaire', async (req, res) => {
  try {
    const { userEmail, answers } = req.body;

    if (!userEmail || !answers) {
      return res.status(400).json({ error: 'User email and answers are required' });
    }

    // Delete old optimal course records for this user
    await pool.query(
      'DELETE FROM optimal WHERE user_email = $1',
      [userEmail]
    );

    // Delete old questionnaire records for this user
    await pool.query(
      'DELETE FROM questionare WHERE user_email = $1',
      [userEmail]
    );

    // Insert new questionnaire answers
    const result = await pool.query(
      `INSERT INTO questionare (
        user_email, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
      RETURNING id`,
      [
        userEmail,
        answers.q1 || null,
        Array.isArray(answers.q2) ? answers.q2.join(',') : answers.q2 || null,
        Array.isArray(answers.q3) ? answers.q3.join(',') : answers.q3 || null,
        answers.q4 || null,
        answers.q5 || null,
        answers.q6 || null,
        answers.q7 || null,
        Array.isArray(answers.q8) ? answers.q8.join(',') : answers.q8 || null,
        answers.q9 || null,
        answers.q10 || null,
        answers.q11 || null,
        answers.q12 || null,
        answers.q13 || null,
        answers.q14 || null
      ]
    );

    const questionareId = result.rows[0].id;

    // Determine optimal course based on answers
    const optimalCourse = determineOptimalCourse(answers);

    // Insert new optimal course result
    await pool.query(
      'INSERT INTO optimal (user_email, questionare_id, optimal_course) VALUES ($1, $2, $3)',
      [userEmail, questionareId, optimalCourse]
    );

    res.json({ success: true, optimalCourse });
  } catch (error) {
    console.error('Submit questionnaire error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to determine optimal course based on answers
function determineOptimalCourse(answers) {
  // Initialize scores
  let gameDevScore = 0;
  let animationScore = 0;
  let humanFigureScore = 0;

  // Q1: Skill level
  const skillLevel = answers.q1;
  if (skillLevel === 'Total beginner' || skillLevel === 'Beginner (some attempts, no structured learning)') {
    gameDevScore += 2;
    animationScore += 1;
  } else if (skillLevel === 'Intermediate (can complete small projects)') {
    animationScore += 2;
    humanFigureScore += 1;
  } else if (skillLevel === 'Advanced (professional or near-professional workflow)') {
    humanFigureScore += 3;
  }

  // Q2: What they've created
  const created = Array.isArray(answers.q2) ? answers.q2 : [answers.q2];
  if (created.includes('Game concepts or prototypes')) gameDevScore += 2;
  if (created.includes('Simple animations or motion studies')) animationScore += 2;
  if (created.includes('Character designs')) {
    animationScore += 1;
    humanFigureScore += 1;
  }
  if (created.includes('Drawings or illustrations')) humanFigureScore += 2;

  // Q3: Tools used
  const tools = Array.isArray(answers.q3) ? answers.q3 : [answers.q3];
  if (tools.includes('Game engines (Unity, Unreal, Godot)')) gameDevScore += 2;
  if (tools.includes('Animation tools (Toon Boom, Blender, RoughAnimator)')) animationScore += 2;
  if (tools.includes('Drawing software (Krita, Photoshop, Procreate…)')) humanFigureScore += 2;

  // Q4: Creative vs Technical
  if (answers.q4 === 'I enjoy building systems, logic, mechanics, tools.') {
    gameDevScore += 3;
  } else if (answers.q4 === 'I enjoy coming up with ideas, characters, stories, visuals.') {
    animationScore += 2;
    humanFigureScore += 2;
  } else if (answers.q4 === 'A mix of both.') {
    gameDevScore += 1;
    animationScore += 1;
  }

  // Q5: What they enjoy more
  if (answers.q5 === 'Step-by-step problem solving and structure') {
    gameDevScore += 2;
  } else if (answers.q5 === 'Creative improvisation and visual decisions') {
    animationScore += 2;
    humanFigureScore += 2;
  }

  // Q6: What frustrates them
  if (answers.q6 === 'Not being able to draw what I imagine') {
    humanFigureScore += 3;
  } else if (answers.q6 === 'Not understanding the technical tools (coding, engines, workflows)') {
    gameDevScore += 1; // They want to learn it
  }

  // Q7: Main reason
  if (answers.q7 === 'Learn how to make my first game') {
    gameDevScore += 3;
  } else if (answers.q7 === 'Improve my animation abilities') {
    animationScore += 3;
  } else if (answers.q7 === 'Master drawing the human figure in a simpler, powerful way') {
    humanFigureScore += 3;
  }

  // Q8: Areas that excite them (up to 2)
  const interests = Array.isArray(answers.q8) ? answers.q8 : [answers.q8];
  if (interests.includes('Technical systems and structure')) gameDevScore += 2;
  if (interests.includes('Movement, motion, and dynamics')) animationScore += 2;
  if (interests.includes('Characters and storytelling')) {
    animationScore += 1;
    humanFigureScore += 1;
  }
  if (interests.includes('Human anatomy, accuracy, and form')) humanFigureScore += 3;
  if (interests.includes('Worldbuilding and mechanics')) gameDevScore += 1;

  // Q9: Time commitment (not heavily weighted)
  // Q10: Learning style (not heavily weighted)

  // Q11: Complex software
  if (answers.q11 === 'I love it' || answers.q11 === 'I don\'t mind it') {
    gameDevScore += 1;
  }

  // Q12: Drawing human figure comfort
  if (answers.q12 === 'I\'ve never seriously tried' || answers.q12 === 'I know some basics') {
    humanFigureScore += 2; // They want to learn
  } else if (answers.q12 === 'I\'m confident drawing people from imagination') {
    humanFigureScore -= 1; // Already advanced
  }

  // Q13: Animation comfort
  if (answers.q13 === 'Never tried' || answers.q13 === 'Can do simple bouncing balls or sketches') {
    animationScore += 2;
  } else if (answers.q13 === 'Strong confidence') {
    animationScore -= 1;
  }

  // Q14: Game dev comfort
  if (answers.q14 === 'Total beginner' || answers.q14 === 'Tried once or twice') {
    gameDevScore += 2;
  } else if (answers.q14 === 'Advanced') {
    gameDevScore -= 1;
  }

  // Determine winner
  const scores = [
    { course: 'Game Dev', score: gameDevScore },
    { course: 'Animation', score: animationScore },
    { course: 'Simplifying the human figure', score: humanFigureScore }
  ];

  scores.sort((a, b) => b.score - a.score);
  return scores[0].course;
}

// Helper function to count words in text
function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// GET user notes
app.get('/api/user/:email/notes', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await pool.query(
      'SELECT id, note_text, word_count, created_at FROM user_notes WHERE user_email = $1 ORDER BY created_at DESC',
      [email]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new note
app.post('/api/user/:email/notes', async (req, res) => {
  try {
    const { email } = req.params;
    const { note_text } = req.body;

    if (!note_text || typeof note_text !== 'string') {
      return res.status(400).json({ error: 'Note text is required' });
    }

    const wordCount = countWords(note_text);

    if (wordCount > 50) {
      return res.status(400).json({ error: 'Note exceeds 50 word limit' });
    }

    if (wordCount === 0) {
      return res.status(400).json({ error: 'Note cannot be empty' });
    }

    const result = await pool.query(
      'INSERT INTO user_notes (user_email, note_text, word_count) VALUES ($1, $2, $3) RETURNING id, note_text, word_count, created_at',
      [email, note_text, wordCount]
    );

    res.json({ success: true, note: result.rows[0] });
  } catch (error) {
    console.error('Save note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE all notes for a user
app.delete('/api/user/:email/notes', async (req, res) => {
  try {
    const { email } = req.params;
    await pool.query(
      'DELETE FROM user_notes WHERE user_email = $1',
      [email]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Delete notes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user achievements endpoint
app.get('/api/user/:email/achievements', async (req, res) => {
  try {
    const { email } = req.params;

    const userResult = await pool.query(
      'SELECT achievements, achievement_discount_granted, achievement_discount_available FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    let achievements = {};

    // Handle achievements - it might be null, a string, or already an object
    if (user.achievements) {
      if (typeof user.achievements === 'string') {
        try {
          achievements = JSON.parse(user.achievements);
        } catch (e) {
          achievements = {};
        }
      } else if (typeof user.achievements === 'object') {
        achievements = user.achievements;
      }
    }

    res.json({
      success: true,
      achievements: achievements,
      discountGranted: user.achievement_discount_granted || false,
      discountAvailable: user.achievement_discount_available || false
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user achievements endpoint
app.post('/api/user/:email/achievements', async (req, res) => {
  try {
    const { email } = req.params;
    const { achievements, discountGranted, discountAvailable } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (achievements !== undefined) {
      updates.push(`achievements = $${paramCount}`);
      values.push(JSON.stringify(achievements));
      paramCount++;
    }

    if (discountGranted !== undefined) {
      updates.push(`achievement_discount_granted = $${paramCount}`);
      values.push(discountGranted);
      paramCount++;
    }

    if (discountAvailable !== undefined) {
      updates.push(`achievement_discount_available = $${paramCount}`);
      values.push(discountAvailable);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(email);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE email = $${paramCount}`,
      values
    );

    res.json({ success: true, message: 'Achievements updated successfully' });
  } catch (error) {
    console.error('Update achievements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user banana clicks endpoint
app.get('/api/user/:email/banana-clicks', async (req, res) => {
  try {
    const { email } = req.params;

    const userResult = await pool.query(
      'SELECT banana_clicks FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      bananaClicks: userResult.rows[0].banana_clicks || 0
    });
  } catch (error) {
    console.error('Get banana clicks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user banana clicks endpoint
app.post('/api/user/:email/banana-clicks', async (req, res) => {
  try {
    const { email } = req.params;
    const { bananaClicks } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (bananaClicks === undefined || bananaClicks === null) {
      return res.status(400).json({ error: 'bananaClicks is required' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.query(
      'UPDATE users SET banana_clicks = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
      [bananaClicks, email]
    );

    res.json({ success: true, message: 'Banana clicks updated successfully' });
  } catch (error) {
    console.error('Update banana clicks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add bookmark endpoint
app.post('/api/bookmarks', async (req, res) => {
  try {
    const { userEmail, courseId } = req.body;

    if (!userEmail || !courseId) {
      return res.status(400).json({ error: 'User email and course ID are required' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Insert bookmark (UNIQUE constraint will prevent duplicates)
    const result = await pool.query(
      `INSERT INTO saved_courses (user_email, course_id) 
       VALUES ($1, $2) 
       ON CONFLICT (user_email, course_id) DO NOTHING
       RETURNING id, course_id, created_at`,
      [userEmail, courseId]
    );

    if (result.rows.length === 0) {
      // Bookmark already exists
      return res.json({ success: true, message: 'Bookmark already exists', alreadyExists: true });
    }

    res.json({ success: true, bookmark: result.rows[0] });
  } catch (error) {
    console.error('Add bookmark error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove bookmark endpoint
app.delete('/api/bookmarks/:userEmail/:courseId', async (req, res) => {
  try {
    const { userEmail, courseId } = req.params;

    if (!userEmail || !courseId) {
      return res.status(400).json({ error: 'User email and course ID are required' });
    }

    const result = await pool.query(
      'DELETE FROM saved_courses WHERE user_email = $1 AND course_id = $2 RETURNING id',
      [userEmail, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    res.json({ success: true, message: 'Bookmark removed successfully' });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user bookmarks endpoint
app.get('/api/bookmarks/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const result = await pool.query(
      'SELECT course_id FROM saved_courses WHERE user_email = $1 ORDER BY created_at DESC',
      [userEmail]
    );

    const bookmarks = result.rows.map(row => row.course_id);

    res.json({ success: true, bookmarks });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user bookmark count endpoint (for achievements)
app.get('/api/bookmarks/:userEmail/count', async (req, res) => {
  try {
    const { userEmail } = req.params;

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM saved_courses WHERE user_email = $1',
      [userEmail]
    );

    const count = parseInt(result.rows[0].count, 10) || 0;

    res.json({ success: true, count });
  } catch (error) {
    console.error('Get bookmark count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OpenRouter AI recommendation endpoint
app.post('/api/recommend-order', async (req, res) => {
  try {
    const { description, serviceTitle, serviceCategory, serviceDescription, servicePrice, basePriceUSD, currency, orderType } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      console.error('OpenRouter API key not configured');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('OPENROUTER')));
      return res.status(500).json({ error: 'API key not configured. Please check backend/.env.local file.' });
    }

    // Parse base price from servicePrice string if basePriceUSD is not provided
    let basePrice = basePriceUSD || 0;
    if (basePrice === 0 && servicePrice) {
      const priceMatch = servicePrice.match(/\$?(\d+)/);
      if (priceMatch) {
        basePrice = parseInt(priceMatch[1], 10);
      }
    }

    // Calculate pricing for each package - EXACT SAME LOGIC AS FRONTEND
    const calculatePackagePrice = (packageType, deliveryTime = 'standard', revisions = 0) => {
      if (basePrice === 0) return 0;

      // Step 1: Apply package multiplier
      let packageMultiplier = 1.0;
      if (packageType === 'standard') {
        packageMultiplier = 1.4; // 40% premium
      } else if (packageType === 'premium') {
        packageMultiplier = 1.8; // 80% premium
      }
      // Basic stays at 1.0 (no premium)

      let total = basePrice * packageMultiplier;

      // Step 2: Add delivery time premium (calculated on base * multiplier)
      if (deliveryTime === 'fast') {
        total += (basePrice * packageMultiplier) * 0.25; // +25% premium
      } else if (deliveryTime === 'very-fast') {
        total += (basePrice * packageMultiplier) * 0.50; // +50% premium
      }
      // Standard delivery (5-7 days) adds nothing

      // Step 3: Add revision costs (only for Basic and Standard, Premium has unlimited)
      if (packageType !== 'premium') {
        const additionalRevisions = parseInt(revisions) || 0;
        if (additionalRevisions > 0) {
          // Each revision costs 10% of BASE PRICE (not multiplied price)
          total += basePrice * 0.10 * additionalRevisions;
        }
      }
      // Premium package includes unlimited revisions, so no extra cost

      return Math.round(total);
    };

    // Currency conversion rates (same as frontend)
    const EXCHANGE_RATES = {
      USD: 1.0,
      EUR: 0.92,
      GEL: 2.65
    };

    const convertCurrency = (usdAmount, targetCurrency) => {
      const rate = EXCHANGE_RATES[targetCurrency] || EXCHANGE_RATES.USD;
      const converted = usdAmount * rate;
      if (targetCurrency === 'GEL') {
        return Math.round(converted);
      }
      return Math.round(converted * 100) / 100;
    };

    const formatPrice = (amount, targetCurrency) => {
      const symbols = { USD: '$', EUR: '€', GEL: '₾' };
      const symbol = symbols[targetCurrency] || '$';
      const formatted = targetCurrency === 'GEL'
        ? Math.round(amount).toString()
        : amount.toFixed(2);
      return `${symbol}${formatted}`;
    };

    // Build comprehensive system prompt with service context
    const basePriceFormatted = formatPrice(convertCurrency(basePrice, currency || 'USD'), currency || 'USD');
    const basicPrice = formatPrice(convertCurrency(calculatePackagePrice('basic', 'standard', 0), currency || 'USD'), currency || 'USD');
    const standardPrice = formatPrice(convertCurrency(calculatePackagePrice('standard', 'standard', 0), currency || 'USD'), currency || 'USD');
    const premiumPrice = formatPrice(convertCurrency(calculatePackagePrice('premium', 'standard', 0), currency || 'USD'), currency || 'USD');

    let systemPrompt = `You are an expert order package recommender for MoodyChimp, a creative services platform. Your job is to recommend the best package type (Basic, Standard, or Premium) based on the user's needs.

IMPORTANT: The pricing structure below applies to ALL services on the platform. Use these exact formulas:

PRICING FORMULA (applies to every service):
1. Start with Base Price: ${basePriceFormatted}
2. Apply Package Multiplier:
   - Basic: 1.0x (no premium) = ${basicPrice}
   - Standard: 1.4x (40% premium) = ${standardPrice}
   - Premium: 1.8x (80% premium) = ${premiumPrice}
3. Add Delivery Premium (calculated on the package price):
   - Standard (5-7 days): +0% (included)
   - Fast (3-5 days): +25% of package price
   - Very Fast (1-3 days): +50% of package price
4. Add Revision Costs (only for Basic/Standard, Premium has unlimited):
   - Each additional revision: +10% of BASE PRICE (not package price)
   - Basic includes 0 revisions
   - Standard includes 1 revision
   - Premium includes unlimited revisions

EXAMPLE CALCULATIONS:
- Basic + Standard delivery + 0 revisions = ${basicPrice}
- Standard + Standard delivery + 0 revisions = ${standardPrice}
- Premium + Standard delivery + 0 revisions = ${premiumPrice}
- Basic + Fast delivery + 2 revisions = ${formatPrice(convertCurrency(calculatePackagePrice('basic', 'fast', 2), currency || 'USD'), currency || 'USD')}
- Standard + Very Fast delivery + 1 revision = ${formatPrice(convertCurrency(calculatePackagePrice('standard', 'very-fast', 1), currency || 'USD'), currency || 'USD')}

PACKAGE FEATURES:
- Basic: Standard delivery (5-7 days), 0 revisions included, best for simple projects
- Standard: Faster delivery (3-5 days), 1 revision included, best for moderate customization
- Premium: Fastest delivery (1-3 days), unlimited revisions, best for complex projects

YOUR TASK:
1. Analyze the user's request carefully
2. Recommend ONE package type (Basic, Standard, or Premium) - ONLY ONE
3. Suggest delivery time if urgent (otherwise recommend standard)
4. Suggest revisions if needed (only for Basic/Standard, Premium has unlimited)
5. Format your response EXACTLY like this (DO NOT include price in your response):

RECOMMENDED: [Basic/Standard/Premium]

• Select the [Package Name] package
• Choose [Standard/Fast/Very Fast] delivery ([X-Y] days)
• Add [X] additional revision(s) if needed (ONLY for Basic/Standard - Premium has unlimited revisions included, so NEVER suggest additional revisions for Premium)
• This package fits because: [brief explanation]

CRITICAL: If recommending Premium, do NOT include "Add X additional revision" in your response. Premium already includes unlimited revisions.

IMPORTANT: 
- Recommend ONLY ONE package - do not mention multiple packages
- DO NOT include price calculations in your response - the system will calculate it
- Keep explanations simple and clear
- This pricing applies to ALL services on the platform
- Start your response with "RECOMMENDED:" followed by the package name only`;

    // Service classification mapping - what each category handles
    const serviceClassifications = {
      'Storyboards': {
        keywords: ['storyboard', 'story board', 'animatic', 'concept board', 'visual planning', 'narrative planning', 'scene planning', 'sequence', 'shot planning'],
        description: 'Visual planning and storyboarding for narratives, animations, and video projects'
      },
      'Book design': {
        keywords: ['book cover', 'book design', 'cover design', 'interior layout', 'book layout', 'typography', 'publishing', 'children\'s book', 'childrens book', 'book illustration', 'page design'],
        description: 'Book cover design, interior layouts, and complete book design packages'
      },
      'Character design': {
        keywords: ['character design', 'character sheet', 'character concept', 'character turnaround', 'character reference', 'character creation', 'character art', 'character illustration'],
        description: 'Character design, concept art, and character reference sheets'
      },
      'Game Design': {
        keywords: ['game design', 'game ui', 'game ux', 'ui/ux', 'user interface', 'user experience', 'game interface', 'level design', 'game mechanics', 'game concept', 'game development', 'game prototyping'],
        description: 'Game design, UI/UX for games, level design, and game development documentation'
      }
    };

    // Add service context and classification
    let currentServiceType = null;
    if (serviceCategory) {
      currentServiceType = serviceCategory;
      systemPrompt += `\n\nCURRENT SERVICE CONTEXT:`;
      systemPrompt += `\nYou are on the order page for: ${serviceTitle || 'Unknown Service'}`;
      systemPrompt += `\nService Category: ${serviceCategory}`;
      if (serviceDescription) {
        systemPrompt += `\nService Description: ${serviceDescription.substring(0, 200)}${serviceDescription.length > 200 ? '...' : ''}`;
      }
      systemPrompt += `\nBase Price: ${servicePrice || basePriceFormatted}`;

      // Add service classification info
      systemPrompt += `\n\nAVAILABLE SERVICE CATEGORIES:`;
      Object.entries(serviceClassifications).forEach(([category, info]) => {
        systemPrompt += `\n- ${category}: ${info.description}`;
        systemPrompt += `\n  Keywords: ${info.keywords.join(', ')}`;
      });

      systemPrompt += `\n\nCRITICAL REQUEST VALIDATION LOGIC:`;
      systemPrompt += `\nYou are currently on the order page for: ${serviceCategory}`;
      systemPrompt += `\n\nFirst, determine if the request is related to ANY service on this platform:`;
      systemPrompt += `\n1. If the request is COMPLETELY UNRELATED to any service (e.g., "I want pizza", "How's the weather", "Tell me a joke", "What time is it", "I need a car", "I want to buy shoes"), respond with:`;
      systemPrompt += `\n   "UNRELATED REQUEST: This request is not related to any service offered on MoodyChimp. Please provide a request related to creative services such as storyboards, book design, character design, or game design."`;
      systemPrompt += `\n\n2. If the request relates to a DIFFERENT service category (not ${serviceCategory}), respond with:`;
      systemPrompt += `\n   "REDIRECT: This request is best suited for [Category Name] services. Please navigate to the [Category Name] section in the Create services to place your order."`;
      systemPrompt += `\n\n3. If the request matches ${serviceCategory}, provide package recommendation`;
      systemPrompt += `\n\nOnly recommend a package if the request clearly matches ${serviceCategory}.`;
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'mysite.com',
          'X-Title': 'MoodyChimp AI Recommender'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `User's request: "${description.trim()}"\n\n${currentServiceType ? `Current service category: ${currentServiceType}\n\nFirst, check if this request matches the current service category. If NOT, provide a redirect message. If it DOES match, recommend the best package type (Basic, Standard, or Premium) with specific delivery time and revisions.` : 'Recommend the best package type (Basic, Standard, or Premium) with specific delivery time and revisions.'}\n\nUse the exact pricing formula provided. Format with bullet points as specified.`
            }
          ],
          max_tokens: 300,
          temperature: 0.5
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        return res.status(response.status).json({
          error: 'Failed to get AI recommendation',
          details: errorText
        });
      }

      const data = await response.json();
      let recommendation = data.choices?.[0]?.message?.content ||
        'Unable to generate recommendation.';

      // Check if this is a redirect or unrelated request response
      const recLower = recommendation.toLowerCase();
      const isUnrelated = recLower.includes('unrelated request:') ||
        recLower.includes('not related to any service');
      const isRedirect = recLower.includes('redirect:') ||
        recLower.includes('best suited for');

      if (isUnrelated || isRedirect) {
        // Return redirect/unrelated response without package calculation
        return res.json({
          success: true,
          recommendation,
          isRedirect: isRedirect,
          isUnrelated: isUnrelated,
          recommendedPackage: null,
          recommendedTotal: null
        });
      }

      // Extract package type, delivery time, and revisions from recommendation
      let recommendedPackage = null;
      let recommendedDelivery = 'standard';
      let recommendedRevisions = 0;

      // Extract package type - prioritize "Select the [package] package" in bullet points (most reliable)
      // This is the actual recommendation, not a header
      const selectMatch = recLower.match(/•\s*select the (basic|standard|premium)\s+package/i) ||
        recLower.match(/-\s*select the (basic|standard|premium)\s+package/i) ||
        recLower.match(/select the (basic|standard|premium)\s+package/i);
      if (selectMatch) {
        recommendedPackage = selectMatch[1].toLowerCase();
      }

      // Fallback: look for "RECOMMENDED:" line but only if it's a single word
      if (!recommendedPackage) {
        const recommendedLine = recommendation.match(/recommended:\s*([^\n•\-]+)/i);
        if (recommendedLine) {
          const recText = recommendedLine[1].toLowerCase().trim();
          // Only accept if it's a single package name (not a sentence)
          if (recText.match(/^\s*(basic|standard|premium)\s*$/i)) {
            recommendedPackage = recText.trim();
          } else if (recText.match(/^(basic|standard|premium)$/i)) {
            recommendedPackage = recText;
          }
        }
      }

      // Last resort: look for package in "Select the [package]" without "package" word
      if (!recommendedPackage) {
        const selectSimpleMatch = recLower.match(/select the (basic|standard|premium)(?:\s|$)/i);
        if (selectSimpleMatch) {
          recommendedPackage = selectSimpleMatch[1].toLowerCase();
        }
      }

      // Extract delivery time
      if (recLower.includes('very fast') || recLower.includes('very-fast') || recLower.includes('1-3 days')) {
        recommendedDelivery = 'very-fast';
      } else if (recLower.includes('fast') || recLower.includes('3-5 days')) {
        recommendedDelivery = 'fast';
      }

      // Extract revisions (look for "add X revision" pattern, not "includes X revision")
      // IMPORTANT: Premium has unlimited revisions, so NEVER extract revisions for Premium
      // Set revisions to 0 FIRST if Premium, then only extract if NOT Premium
      if (recommendedPackage === 'premium') {
        // Premium has unlimited revisions, so always set to 0
        recommendedRevisions = 0;
      } else {
        // Only extract revisions for Basic/Standard
        const addRevisionMatch = recLower.match(/add\s+(\d+)\s+additional?\s+revision/i);
        if (addRevisionMatch) {
          recommendedRevisions = parseInt(addRevisionMatch[1]) || 0;
        }
      }

      // Calculate recommended total based on extracted values
      let recommendedTotalUSD = 0;
      if (recommendedPackage && basePrice > 0) {
        recommendedTotalUSD = calculatePackagePrice(recommendedPackage, recommendedDelivery, recommendedRevisions);

        // Debug logging for price calculation
        console.log('Price calculation debug:', {
          basePrice,
          recommendedPackage,
          recommendedDelivery,
          recommendedRevisions,
          calculatedTotalUSD: recommendedTotalUSD,
          currency: currency || 'USD',
          convertedTotal: convertCurrency(recommendedTotalUSD, currency || 'USD')
        });
      }
      const recommendedTotal = recommendedTotalUSD > 0 ? convertCurrency(recommendedTotalUSD, currency || 'USD') : null;

      res.json({
        success: true,
        recommendation,
        recommendedPackage,
        recommendedTotal: recommendedTotal
      });

    } catch (apiError) {
      console.error('OpenRouter API error:', apiError);
      res.status(500).json({
        error: 'Failed to get AI recommendation',
        details: apiError.message || 'Unknown error occurred'
      });
    }

  } catch (error) {
    console.error('Recommend order error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message || 'Unknown error occurred'
    });
  }
});

// Webhook endpoint for n8n to check achievements and send reminders
// This endpoint checks all users and sends notifications to those who haven't unlocked all achievements
app.post('/api/webhook/check-achievements', async (req, res) => {
  try {
    // Optional: Add webhook authentication/secret key check here
    const webhookSecret = req.headers['x-webhook-secret'] || req.body.secret;
    const expectedSecret = process.env.WEBHOOK_SECRET;

    if (expectedSecret && webhookSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized: Invalid webhook secret' });
    }

    // Define all achievement IDs (must match frontend/src/achievements.js)
    const ALL_ACHIEVEMENT_IDS = [
      'first-login',
      'quiz-complete',
      'first-bookmark',
      'first-service-view',
      'profile-complete',
      'first-order',
      'first-review',
      'three-bookmarks',
      'unemployment'
    ];

    // Get all users
    const usersResult = await pool.query('SELECT email, achievements, last_achievement_reminder_sent FROM users');
    const users = usersResult.rows;

    const results = {
      totalUsers: users.length,
      checked: 0,
      notificationsSent: 0,
      usersWithAllAchievements: 0,
      errors: []
    };

    const REMINDER_MESSAGE = 'Complete all achievements to earn a 30% discount on all purchases';
    const REMINDER_TITLE = 'Achievement Reminder';
    const REMINDER_INTERVAL_MINUTES = 5; // Send reminder every 5 minutes

    // Use a system/admin email as sender (you can configure this)
    // If the email doesn't exist in users table, we'll use NULL
    const SYSTEM_SENDER_EMAIL = process.env.SYSTEM_SENDER_EMAIL || 'system@moodychimp.com';

    // Verify system sender email exists, otherwise use NULL
    let actualSenderEmail = null;
    if (SYSTEM_SENDER_EMAIL) {
      const senderCheck = await pool.query('SELECT email FROM users WHERE email = $1', [SYSTEM_SENDER_EMAIL]);
      if (senderCheck.rows.length > 0) {
        actualSenderEmail = SYSTEM_SENDER_EMAIL;
      }
      // If sender doesn't exist, actualSenderEmail remains null (which is allowed)
    }

    for (const user of users) {
      try {
        results.checked++;

        // Parse achievements
        let achievements = {};
        if (user.achievements) {
          if (typeof user.achievements === 'string') {
            try {
              achievements = JSON.parse(user.achievements);
            } catch (e) {
              achievements = {};
            }
          } else if (typeof user.achievements === 'object') {
            achievements = user.achievements;
          }
        }

        // Check if user has all achievements unlocked
        const unlockedCount = Object.keys(achievements).filter(key => achievements[key] === true).length;
        const hasAllAchievements = unlockedCount === ALL_ACHIEVEMENT_IDS.length;

        if (hasAllAchievements) {
          results.usersWithAllAchievements++;
          continue; // Skip users who have all achievements
        }

        // Check if we should send a reminder (only if 5+ minutes have passed since last reminder)
        const now = new Date();
        const lastReminderSent = user.last_achievement_reminder_sent
          ? new Date(user.last_achievement_reminder_sent)
          : null;

        if (lastReminderSent) {
          const minutesSinceLastReminder = (now - lastReminderSent) / (1000 * 60);
          if (minutesSinceLastReminder < REMINDER_INTERVAL_MINUTES) {
            continue; // Too soon to send another reminder
          }
        }

        // Send notification
        const notificationResult = await pool.query(
          `INSERT INTO notifications (user_email, title, message, type, sender_email, read)
           VALUES ($1, $2, $3, 'message', $4, FALSE)
           RETURNING id`,
          [user.email, REMINDER_TITLE, REMINDER_MESSAGE, actualSenderEmail]
        );

        // Update last_achievement_reminder_sent timestamp
        await pool.query(
          'UPDATE users SET last_achievement_reminder_sent = CURRENT_TIMESTAMP WHERE email = $1',
          [user.email]
        );

        results.notificationsSent++;
        console.log(`Achievement reminder sent to: ${user.email}`);

      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        results.errors.push({ email: user.email, error: userError.message });
      }
    }

    res.json({
      success: true,
      message: 'Achievement check completed',
      results
    });

  } catch (error) {
    console.error('Webhook check achievements error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (!process.env.DATABASE_URL) {
    console.warn('WARNING: DATABASE_URL not set in environment variables');
  }
});

