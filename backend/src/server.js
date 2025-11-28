require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable JSON parsing and basic CORS so the frontend can call the API locally.
app.use(cors());
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
}, 1000);

// Simple in-memory placeholder data to avoid database usage for now.
const appInfo = {
  name: 'Learning Web App',
  version: '0.1.0',
  message: 'Welcome to your first full-stack project!'
};

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
      'SELECT id, email, password, username, avatar_url, title, color_theme FROM users WHERE email = $1', 
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userResult.rows[0];

    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Get user error:', error);
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
    const result = await pool.query('SELECT * FROM Course_Service ORDER BY id');

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

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (!process.env.DATABASE_URL) {
    console.warn('WARNING: DATABASE_URL not set in environment variables');
  }
});

