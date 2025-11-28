# MoodyChimp - Creative Studio Platform

## Overview

MoodyChimp is a modern creative studio platform that serves as both a marketplace for creative services and an educational hub for digital art and creation. The platform connects clients with creative professionals while offering structured learning courses for aspiring artists, animators, and game developers.

### Purpose

The platform serves two main purposes:

1. **Create Services**: A marketplace where clients can order creative, technical, and personal work across multiple categories including Storyboards, Book Design, Character Design, and Game Design.

2. **Learn Services**: An educational platform offering online courses taught by freelance tutors and teachers, covering topics from beginner to advanced levels in Game Development, Animation, and Figure Drawing.

## Architecture

### Tech Stack

**Frontend:**
- **React 18** with modern hooks (useState, useEffect, useRef)
- **Vite 5** for fast development and optimized builds
- **CSS3** with custom styling, gradients, and animations
- **LocalStorage** for client-side session management

**Backend:**
- **Node.js** with **Express 5** framework
- **PostgreSQL** database (hosted on Neon)
- **pg** library for database connectivity
- **dotenv** for environment variable management
- **CORS** enabled for frontend-backend communication

### Project Structure

```
lecture_project2/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main application component
│   │   ├── App.css          # Global styles
│   │   ├── LoginModal.jsx    # Authentication modal
│   │   ├── AccountPage.jsx  # User account management
│   │   ├── Questionnaire.jsx # Course recommendation quiz
│   │   ├── QuestionnaireResult.jsx # Quiz results display
│   │   └── assets/          # Images and logos
│   └── package.json
├── backend/
│   ├── src/
│   │   └── server.js        # Express server and API endpoints
│   ├── .env                 # Environment variables (database credentials)
│   └── package.json
└── docs/                    # Documentation files
```

## Design Philosophy

### Visual Aesthetic

The site features a **brutalist-inspired design** with a modern twist:

- **Color Palette**: 
  - Primary: Custom gradient combinations (yellow-orange-blue)
  - Secondary: `#6F7FD4` (purple-blue)
  - Accents: Red for tags, orange/yellow/blue for course recommendations

- **Typography**: 
  - Mixed font styles including brutal, technical, serif, and script fonts
  - Dynamic word highlighting with different font classes
  - Responsive typography scaling

- **Layout**:
  - Fixed header that stays on top during scroll
  - Hero section with large logo and animated title
  - Card-based service displays
  - Modal overlays with blurred backgrounds

### User Experience

- **Progressive Disclosure**: Login modal appears on first visit, with "maybe later" option
- **Persistent Sessions**: User login state maintained via LocalStorage
- **Responsive Design**: Mobile-friendly layouts with media queries
- **Smooth Interactions**: CSS transitions and hover effects throughout
- **Visual Feedback**: Clear error messages, loading states, and success indicators

## Features

### 1. User Authentication

- **First-Time Visitor Flow**: 
  - Login modal appears automatically on first visit
  - Options: Sign In, Sign Up, or "Maybe Later"
  - If "Maybe Later" is selected, login option appears in header

- **Sign Up**:
  - Email registration
  - Password creation with confirmation
  - Data stored in PostgreSQL `users` table

- **Sign In**:
  - Email and password authentication
  - Session persistence via LocalStorage
  - Error handling for incorrect credentials

### 2. Account Management

- **Account Page**:
  - Sidebar with user profile (default banana avatar)
  - "My Account" section displaying:
    - Email (always visible)
    - Password (hidden by default, requires verification to reveal)
  - Password verification modal with eye icon toggle
  - Logout functionality

### 3. Services Section

#### Learn Services
- Three course offerings:
  - **Game Dev** (Beginner)
  - **Animation** (Beginner-Intermediate)
  - **Simplifying the Human Figure** (Intermediate-Advanced)
- Square card layout with visual illustrations
- Horizontal alignment with responsive sizing
- "Optimal!" tag in red for recommended courses

#### Create Services
- Four main categories:
  - **Storyboards**: Concept, Animatic, Production
  - **Book Design**: Cover, Interior Layout, Complete Package
  - **Character Design**: Concept, Full Character, Character Sheet
  - **Game Design**: Concept, Prototype, Full Game
- Dropdown navigation between categories
- Service cards with title, description, and pricing
- Half-width cards for better visual organization

### 4. Course Recommendation Questionnaire

A comprehensive 14-question assessment across 5 sections:

**Section 1 - Background & Experience**
- Current skill level assessment
- Previous creative work experience
- Tool familiarity

**Section 2 - Creative vs Technical Orientation**
- Preference for creative vs technical work
- Problem-solving style
- Frustration points

**Section 3 - Preferences & Interests**
- Main reason for joining
- Areas of excitement (up to 2 selections)

**Section 4 - Commitment & Learning Style**
- Weekly time commitment
- Preferred learning method
- Software complexity comfort level

**Section 5 - Self-Assessment**
- Drawing comfort level
- Animation experience
- Game development experience

**Result Logic:**
- **Game Dev** recommended for: Beginners interested in mechanics/systems, technical orientation, low-medium art experience
- **Animation** recommended for: Beginner-intermediate users interested in movement/storytelling, creative/visual preference
- **Simplifying the Human Figure** recommended for: Intermediate-advanced users with strong anatomy interest, artistic focus

**Result Display:**
- Personalized messages:
  - Game Dev: "You're a NerdyChimp!" (blue font)
  - Animation: "You're a GetReadyToBeASlaveChimp!" (orange font)
  - Simplifying the Human Figure: "You're a BrokeChimp!" (yellow font)
- Optimal course recommendation
- Results stored in database and overwrite previous submissions

### 5. Questionnaire Access Control

- **"Not Sure?" Box**: 
  - Prominent yellow-blue gradient box in Learn section
  - "find out!" button to access questionnaire
  - **Logged In Users**: Direct access to questionnaire
  - **Not Logged In**: Redirected to login modal

## Database Schema

### Tables

1. **users**
   - `id` (SERIAL PRIMARY KEY)
   - `email` (VARCHAR(255) UNIQUE NOT NULL)
   - `password` (VARCHAR(255) NOT NULL)
   - `created_at` (TIMESTAMP)

2. **services**
   - `id` (SERIAL PRIMARY KEY)
   - `category` (VARCHAR(100) NOT NULL)
   - `title` (VARCHAR(255) NOT NULL)
   - `description` (TEXT)
   - `price` (VARCHAR(100))
   - `created_at` (TIMESTAMP)

3. **Course_Service**
   - `id` (SERIAL PRIMARY KEY)
   - `title` (VARCHAR(255) NOT NULL)
   - `level` (VARCHAR(100) NOT NULL)
   - `icon` (VARCHAR(10))
   - `illustration` (VARCHAR(10))
   - `created_at` (TIMESTAMP)

4. **questionare**
   - `id` (SERIAL PRIMARY KEY)
   - `user_email` (VARCHAR(255) NOT NULL)
   - `q1` through `q14` (VARCHAR(100) or TEXT for multi-select)
   - `created_at` (TIMESTAMP)

5. **optimal**
   - `id` (SERIAL PRIMARY KEY)
   - `user_email` (VARCHAR(255) NOT NULL)
   - `questionare_id` (INTEGER REFERENCES questionare(id))
   - `optimal_course` (VARCHAR(255) NOT NULL)
   - `created_at` (TIMESTAMP)

## API Endpoints

### Authentication
- `POST /api/signup` - User registration
- `POST /api/signin` - User login
- `POST /api/verify-password` - Password verification for account access

### User Data
- `GET /api/user/:email` - Get user information
- `GET /api/user-optimal/:email` - Get user's optimal course recommendation

### Services
- `GET /api/services` - Get all Create services
- `GET /api/services/:category` - Get services by category
- `GET /api/course-services` - Get all Learn services (courses)

### Questionnaire
- `POST /api/questionnaire` - Submit questionnaire answers and get optimal course
  - Deletes previous questionnaire and optimal records before inserting new ones
  - Returns optimal course recommendation

### Status
- `GET /api/status` - Server health check

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database (Neon cloud database configured)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/LevanPeradze/lecture_MoodyChimp.git
   cd lecture_MoodyChimp
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   
   Create a `.env` file in the `backend/` directory:
   ```
   DATABASE_URL=your_postgresql_connection_string
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Server runs on `http://localhost:4000`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on `http://localhost:5173` (or Vite's default port)

3. **Access the Application**
   - Open `http://localhost:5173` in your browser
   - The backend API will be automatically called from the frontend

### Environment Variables

The `.env` file in the `backend/` directory contains:
- `DATABASE_URL`: PostgreSQL connection string (stored securely, not committed to git)

## Current State

### Implemented Features
✅ User authentication (sign up, sign in, logout)  
✅ Account management with password protection  
✅ Services display (Learn and Create categories)  
✅ Course recommendation questionnaire (14 questions, 5 sections)  
✅ Optimal course calculation and display  
✅ Database integration (PostgreSQL)  
✅ Responsive design  
✅ Session persistence  
✅ Questionnaire result display with personalized messages  

### Design Elements
✅ Fixed header with logo  
✅ Hero section with animated title  
✅ Gradient-based color scheme  
✅ Modal overlays with blur effects  
✅ Card-based service displays  
✅ Styled questionnaire interface  
✅ "Optimal!" course tags  

### Data Management
✅ All user data stored in PostgreSQL  
✅ Services fetched dynamically from database  
✅ Questionnaire answers persisted  
✅ Optimal course recommendations stored  
✅ Previous questionnaire submissions overwritten on resubmission  

## Security Considerations

- Passwords are stored in the database (consider hashing for production)
- Database credentials stored in `.env` file (excluded from git)
- CORS enabled for local development
- Email validation and case-insensitive matching
- Password verification required for sensitive account information

## Future Enhancements

- Password hashing (bcrypt)
- JWT token-based authentication
- Payment integration for services
- Course enrollment system
- User dashboard with progress tracking
- Service ordering workflow
- Email notifications
- Admin panel for service management
- Search and filtering for services
- User reviews and ratings

## Contributing

This is a learning project. Contributions and suggestions are welcome!

## License

[Specify license if applicable]

---

**Built with passion for creative education and digital artistry.**

