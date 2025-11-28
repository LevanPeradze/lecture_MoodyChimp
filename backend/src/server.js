require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable JSON parsing and basic CORS so the frontend can call the API locally.
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize users table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Error creating table:', err));

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
    { title: 'Game Dev', level: 'for beginners', icon: '🎮', illustration: '🎮' },
    { title: 'Animation', level: 'beginner-intermediate', icon: '🎬', illustration: '🎬' },
    { title: 'Simplifying the human figure', level: 'intermediate-advanced', icon: '✏️', illustration: '✏️' },
  ];

  for (const course of courseServices) {
    try {
      // Check if course service already exists
      const existing = await pool.query(
        'SELECT id FROM Course_Service WHERE title = $1',
        [course.title]
      );
      
      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO Course_Service (title, level, icon, illustration) VALUES ($1, $2, $3, $4)',
          [course.title, course.level, course.icon, course.illustration]
        );
        console.log(`Inserted course service: ${course.title}`);
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

    const result = await pool.query('SELECT id, email, password FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
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

// Get services by category endpoint
app.get('/api/services/:category', async (req, res) => {
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

// Get all services endpoint
app.get('/api/services', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services ORDER BY category, id');

    res.json({ success: true, services: result.rows });
  } catch (error) {
    console.error('Get all services error:', error);
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
});

