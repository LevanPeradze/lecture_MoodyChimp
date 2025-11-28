# Feature Planning & Organization Document

## Overview

This document organizes 25 planned features for the MoodyChimp platform, categorized by functionality, complexity, and implementation priority. Features are grouped to ensure logical development flow and identify dependencies.

---

## Feature Categories

### 1. User Engagement & Gamification
*Features that enhance user interaction and provide entertainment value*

### 2. Learning & Course Features
*Features specific to the Learn section and course experience*

### 3. Service Discovery & Management
*Features for browsing, comparing, and selecting Create services*

### 4. Account & Profile Management
*Features for personalization and user profile customization*

### 5. UI/UX Enhancements
*Global interface improvements and accessibility features*

### 6. Content & Social Features
*Features for user-generated content and community interaction*

---

## Detailed Feature Breakdown

## Category 1: User Engagement & Gamification

### Feature 1: Skill Seeds Pop-Ups
**ID:** F001  
**Priority:** Medium  
**Complexity:** Low  
**Dependencies:** None

**Location:** Global (bottom-right corner, any page)  
**UI Components:**
- Small floating box with random art tip
- Dismiss button
- Save button

**Functionality:**
- Appears every 60 seconds
- User can save tips
- User can dismiss current tip

**Storage:** LocalStorage → `savedSkillSeeds` (array)  
**Data Source:** Static array of tips in component or separate file  
**Implementation Notes:**
- Use `setInterval` for 60-second timer
- Store saved tips as array of tip IDs or text
- Position: `position: fixed; bottom: 20px; right: 20px;`

---

### Feature 4: Micro-Achievements
**ID:** F004  
**Priority:** Medium  
**Complexity:** Low  
**Dependencies:** None

**Location:** AccountPage.jsx → under user avatar  
**UI Components:**
- Small badge icons grid
- Achievement name/tooltip on hover

**Functionality:**
- Unlock automatically on triggers:
  - First login
  - Quiz completion
  - First bookmark
  - First service view
  - Profile completion

**Storage:** LocalStorage → `chimpAchievements` (object with achievement IDs as keys)  
**Implementation Notes:**
- Check logic in App.jsx or AccountPage.jsx
- Achievement definitions in static array
- Visual feedback on unlock (animation)

---

### Feature 10: Secret Keyboard Easter Egg
**ID:** F010  
**Priority:** Low  
**Complexity:** Low  
**Dependencies:** None

**Location:** Global (App.jsx key listener)  
**UI Components:**
- Hidden chimp emoji appears in footer when triggered

**Functionality:**
- Detect key sequence: "M-O-N-K-E"
- Show emoji/animation in footer
- One-time reveal (stored in LocalStorage)

**Storage:** LocalStorage → `foundEasterEgg: true`  
**Implementation Notes:**
- Use `useEffect` with keydown listener in App.jsx
- Track sequence in state array
- Reset sequence after timeout or wrong key

---

### Feature 13: Tiny On-Page Game (Click the Banana)
**ID:** F013  
**Priority:** Low  
**Complexity:** Low  
**Dependencies:** None

**Location:** Bottom-left floating widget  
**UI Components:**
- Small bouncing banana icon
- Click counter display (optional)

**Functionality:**
- Click increments counter
- Shows fun message at milestones (10, 50, 100 clicks)
- Bouncing animation

**Storage:** LocalStorage → `bananaClicks: number`  
**Implementation Notes:**
- CSS animation for bounce
- Simple click handler
- Optional: confetti animation on milestones

---

### Feature 16: "Level-Up Wheel" Animation
**ID:** F016  
**Priority:** Low  
**Complexity:** Medium  
**Dependencies:** Feature 4 (QuestionnaireResult)

**Location:** QuestionnaireResult.jsx → under optimal course message  
**UI Components:**
- Animated circular graphic/wheel
- Stats display (Creativity, Technical, Artistic, etc.)

**Functionality:**
- Spins on result page load
- Shows random "stats" like "Creativity: 78"
- Values generated from Math.random() or based on answers

**Storage:** None (or LocalStorage for persistence)  
**Implementation Notes:**
- CSS keyframes for spin animation
- Stats calculated from questionnaire answers (optional)
- Or purely random for fun

---

## Category 2: Learning & Course Features

### Feature 2: Mood-Based Course Selector
**ID:** F002  
**Priority:** Medium  
**Complexity:** Low  
**Dependencies:** None

**Location:** Learn section → under existing course cards  
**UI Components:**
- Row of colored mood buttons (e.g., "Energetic", "Focused", "Creative", "Relaxed")
- Highlighted course card on selection

**Functionality:**
- Clicking a mood highlights one recommended course
- Simple mapping: mood → course ID

**Storage:** None  
**Implementation Notes:**
- Static mapping object: `{ "energetic": "game-dev", "focused": "animation", ... }`
- Update course card styling on mood selection
- Reset on page navigation

---

### Feature 5: Manual Course Progress Bar
**ID:** F005  
**Priority:** Medium  
**Complexity:** Low  
**Dependencies:** Feature 24 (Course Details Page)

**Location:** Learn service pages or Learn section  
**UI Components:**
- Progress bar (0-100%)
- Checkboxes for "Lesson 1, Lesson 2, Lesson 3..." (configurable count)

**Functionality:**
- User clicks checkboxes → updates progress bar
- Progress calculated: (checked / total) * 100

**Storage:** LocalStorage → `courseProgress:<courseID>` (object with lesson IDs as keys)  
**Implementation Notes:**
- Store as: `{ "game-dev": { "lesson1": true, "lesson2": false, ... } }`
- Progress bar updates reactively
- No backend needed

---

### Feature 6: Monthly "Draw This Chimp" Prompt
**ID:** F006  
**Priority:** Low  
**Complexity:** Low  
**Dependencies:** None

**Location:** Learn section → above courses  
**UI Components:**
- Card showing monthly prompt
- Image display
- Text description

**Functionality:**
- Display current month's prompt
- Fetch from static JSON or hardcode

**Storage:** None (or LocalStorage for current month tracking)  
**Data Source:** Static JSON file or hardcoded array  
**Implementation Notes:**
- Store prompts in `prompts.json` or component state
- Check month on load, update if new month
- Simple card design matching site aesthetic

---

### Feature 9: Bookmark Courses
**ID:** F009  
**Priority:** High  
**Complexity:** Low  
**Dependencies:** None

**Location:** 
- Each Learn service card (heart icon top-right)
- Header: "Saved Stuff" button

**UI Components:**
- Heart icon (filled when bookmarked)
- Bookmarks page/modal with list of saved courses

**Functionality:**
- Clicking heart toggles bookmark
- "Saved Stuff" button opens bookmarks page
- Display bookmarked courses in list

**Storage:** LocalStorage → `bookmarkedCourses` (array of course IDs)  
**Implementation Notes:**
- Toggle function: add/remove course ID from array
- Bookmarks page: filter courses by bookmarked IDs
- Heart icon: conditional rendering based on bookmark state

---

### Feature 20: Random Question Button
**ID:** F020  
**Priority:** Low  
**Complexity:** Low  
**Dependencies:** Feature 4 (Questionnaire)

**Location:** Questionnaire page top  
**UI Components:**
- Small button: "Warm up my brain"
- Popup/modal for question display

**Functionality:**
- Shows random creative/weird question in popup
- Questions stored in static array

**Storage:** None  
**Implementation Notes:**
- Array of questions in component or separate file
- `Math.random()` to select question
- Simple modal/popup component

---

### Feature 22: Ratings With Comments
**ID:** F022  
**Priority:** High  
**Complexity:** High  
**Dependencies:** Feature 24 (Details Pages), Backend API

**Location:**
- Create Service detail page
- Learn Course detail page

**UI Components:**
- 5-star rating input (clickable stars)
- Textarea "Leave a comment"
- List of previous ratings + comments (newest first)

**Functionality:**
- Users can submit rating (1-5 stars) + comment
- Display list sorted by newest
- Only logged-in users can post

**Storage:**
- **Backend:** New table `reviews`
  - `id` (SERIAL PRIMARY KEY)
  - `user_email` (VARCHAR(255) NOT NULL)
  - `item_id` (INTEGER NOT NULL)
  - `item_type` (VARCHAR(50) NOT NULL) - "course" or "service"
  - `rating` (INTEGER, 1-5)
  - `comment` (TEXT)
  - `created_at` (TIMESTAMP)

**API Endpoints:**
- `GET /api/reviews/:itemType/:itemId` - Fetch reviews
- `POST /api/reviews` - Submit new review
- `DELETE /api/reviews/:id` - Delete own review (optional)

**Implementation Notes:**
- Check `isLoggedIn` before showing input
- Star component: hover and click handlers
- Display average rating at top
- Pagination if many reviews

---

### Feature 24: Product/Course/Service Details Page
**ID:** F024  
**Priority:** High  
**Complexity:** Medium  
**Dependencies:** Feature 22 (Ratings), React Router

**Location:** New page route: `/details/:type/:id`  
**UI Components:**
- Large banner image
- Title, description, difficulty level
- Price (if service)
- "Add to bookmarks" icon (uses Feature 9)
- Ratings & comments section (uses Feature 22)
- "Back" button

**Functionality:**
- Fetch item details via:
  - `/api/services/:id` for Create services
  - `/api/course-services/:id` for Learn courses
- Display all information from DB

**Storage:** None (fetched on load)  
**Implementation Notes:**
- Install React Router if not already: `npm install react-router-dom`
- Dynamic route: `<Route path="/details/:type/:id" element={<DetailsPage />} />`
- Parse `type` and `id` from URL params
- Conditional rendering based on type
- Link from service/course cards to details page

---

## Category 3: Service Discovery & Management

### Feature 7: Quick Price Calculator
**ID:** F007  
**Priority:** Medium  
**Complexity:** Low  
**Dependencies:** None

**Location:** Create Services → under category title  
**UI Components:**
- Two sliders: Complexity (1-5), Speed (1-5)
- Price output display (live update)

**Functionality:**
- Simple formula: `basePrice + (complexity * multiplier) + (speed * multiplier)`
- Price updates live as sliders change

**Storage:** None  
**Implementation Notes:**
- React state for slider values
- Formula can be configurable per service category
- Display formatted price: `$XXX.XX`

---

### Feature 8: Random Service Generator
**ID:** F008  
**Priority:** Low  
**Complexity:** Low  
**Dependencies:** None

**Location:** Create Services page top  
**UI Components:**
- "Show me something random" button

**Functionality:**
- Picks random service card from fetched services
- Scrolls to selected service card

**Storage:** None  
**Implementation Notes:**
- Use service list already fetched from API
- `Math.random()` to select index
- `scrollIntoView()` or `scrollTo()` to navigate
- Optional: highlight animation on target card

---

### Feature 14: Build My Bundle
**ID:** F014  
**Priority:** Medium  
**Complexity:** Medium  
**Dependencies:** None

**Location:** Create Services page footer  
**UI Components:**
- Multi-select dropdown (or checkboxes)
- Selected services list
- Bundle price display
- "Create Bundle" button

**Functionality:**
- User selects 2-3 services
- Combined suggested price with discount formula
- Example: `(sum of prices) * 0.85` (15% discount)

**Storage:** None (or LocalStorage for draft bundles)  
**Implementation Notes:**
- Track selected service IDs in state
- Calculate discount: configurable percentage
- Display breakdown: individual prices + discount + total
- Optional: save draft bundle to LocalStorage

---

### Feature 15: Service Comparison Toggle
**ID:** F015  
**Priority:** Low  
**Complexity:** Medium  
**Dependencies:** None

**Location:** Create service cards (checkbox bottom left)  
**UI Components:**
- Checkbox on each service card
- Comparison modal (opens when 2 selected)
- Table comparing properties

**Functionality:**
- Select 2 cards → show modal with comparison table
- Properties: Price, Category, Description, Complexity, etc.

**Storage:** Local state only  
**Implementation Notes:**
- Track selected services in component state (max 2)
- Modal opens automatically when 2 selected
- Table columns: Property | Service 1 | Service 2
- Clear selection button in modal

---

### Feature 18: Recently Viewed Services
**ID:** F018  
**Priority:** Medium  
**Complexity:** Low  
**Dependencies:** Feature 24 (Details Pages)

**Location:** Homepage → under hero section  
**UI Components:**
- Horizontal strip of small cards
- Thumbnail, title, link to service

**Functionality:**
- Track last 3 visited service/course detail pages
- Display in horizontal scrollable strip

**Storage:** LocalStorage → `recentServices` (array of objects)  
**Data Structure:**
```javascript
[
  { id: 1, type: "service", title: "Concept Storyboard", thumbnail: "url" },
  { id: 2, type: "course", title: "Game Dev", thumbnail: "url" },
  ...
]
```
**Implementation Notes:**
- Update array on detail page visit (push new, remove duplicates, limit to 3)
- Store in LocalStorage on each visit
- Display only if array has items
- Link to `/details/:type/:id`

---

### Feature 23: Filters
**ID:** F023  
**Priority:** High  
**Complexity:** Medium  
**Dependencies:** None

**Location:**
- Create Services page (top)
- Learn Courses page (top)

**UI Components:**
- Dropdown or checkbox filters
- Filter options: Price range, Difficulty, Category, etc.

**Functionality:**
- Selecting filters refines displayed list
- Dynamic filtering on frontend (no backend needed)

**Storage:** Optional LocalStorage → `lastFiltersUsed`  
**Implementation Notes:**
- Filter function: `services.filter(service => matchesFilters(service, filters))`
- Filter options defined in array
- Reset filters button
- Optional: save last used filters to LocalStorage
- Update URL params for shareable filtered links (optional)

---

## Category 4: Account & Profile Management

### Feature 3: Sticky Notes in Account Page
**ID:** F003  
**Priority:** Low  
**Complexity:** Low  
**Dependencies:** None

**Location:** AccountPage.jsx, right side  
**UI Components:**
- Textarea (editable)
- "Save Note" button
- Character count (optional)

**Functionality:**
- Saves editable personal notes
- Auto-load on page open

**Storage:** LocalStorage → `userNotes:<email>` or DB  
**Implementation Notes:**
- If using LocalStorage: key includes email for multi-user support
- If using DB: add `notes` TEXT field to `users` table
- Auto-save on blur (optional) or manual save button
- Display saved text in textarea on load

---

### Feature 11: Profile Title Customizer
**ID:** F011  
**Priority:** Low  
**Complexity:** Low  
**Dependencies:** None

**Location:** AccountPage.jsx → below avatar  
**UI Components:**
- Dropdown select
- Options: "Banana Baron", "Creative Chimp", "Art Ape", etc.

**Functionality:**
- Selected title appears next to username in header
- Simple mapping

**Storage:** LocalStorage OR backend `users` table  
**Implementation Notes:**
- Add `title` field to `users` table (optional)
- Or use LocalStorage: `userTitle:<email>`
- Update header display when title changes
- Default: no title or "MoodyChimp User"

---

### Feature 17: Profile Color Themes
**ID:** F017  
**Priority:** Low  
**Complexity:** Low  
**Dependencies:** None

**Location:** AccountPage.jsx → "Themes" section  
**UI Components:**
- 5 color swatches (clickable)
- Preview of theme

**Functionality:**
- Applies CSS class to account page container
- Only affects account page styling

**Storage:** LocalStorage → `userTheme` (theme name)  
**Implementation Notes:**
- Define CSS classes: `.theme-blue`, `.theme-purple`, etc.
- Apply class to account page wrapper
- Store theme name in LocalStorage
- Load theme on page mount

---

### Feature 25: Profile Editing
**ID:** F025  
**Priority:** High  
**Complexity:** High  
**Dependencies:** Feature 11 (Profile Title), Backend API

**Location:** AccountPage.jsx → add new "Edit Profile" section  
**UI Components:**
- Editable fields:
  - Username (text input)
  - Profile title (dropdown, if using Feature 11)
  - Profile avatar upload (file input + preview)
- "Save Changes" button
- "Cancel" button

**Functionality:**
- Allows user to modify profile info
- Updating avatar → display preview
- On save: send data to backend

**Storage:**
- **Backend:** Update `users` table
  - Add fields: `username` (VARCHAR), `avatar_url` (VARCHAR), `title` (VARCHAR, optional)

**API Endpoints:**
- `GET /api/user/:email` - Fetch current profile (already exists)
- `POST /api/update-profile` - Update profile
  - Body: `{ email, username?, avatar_url?, title? }`
  - Only update fields provided

**Implementation Notes:**
- File upload: use `<input type="file">` with image preview
- Avatar upload: convert to base64 or upload to storage (simpler: base64 for now)
- Validation: username length, file size/type for avatar
- Show success message on save
- Update header display immediately after save

---

## Category 5: UI/UX Enhancements

### Feature 19: Notification Bell
**ID:** F019  
**Priority:** Medium  
**Complexity:** Low  
**Dependencies:** None

**Location:** Header right side  
**UI Components:**
- Bell icon
- Number badge (red circle with count)
- Dropdown panel with notification list

**Functionality:**
- Shows small notifications:
  - New monthly prompt available
  - Incomplete profile reminder
  - Achievement unlocked
  - New course available (optional)

**Storage:** LocalStorage → `chimpNotifications` (array)  
**Data Structure:**
```javascript
[
  { id: 1, message: "New monthly prompt available!", read: false, timestamp: "..." },
  ...
]
```
**Implementation Notes:**
- Check conditions on app load
- Add notifications to array
- Mark as read on click
- Badge shows unread count
- Optional: auto-dismiss after X days

---

### Feature 21: Dark Mode / Light Mode
**ID:** F021  
**Priority:** High  
**Complexity:** Medium  
**Dependencies:** None

**Location:** Header (top-right), global across all pages  
**UI Components:**
- Toggle switch (🌙 / ☀️ icon)
- Or button that cycles themes

**Functionality:**
- Clicking switch toggles dark / light theme
- Adds CSS class to `<body>` (e.g., `.dark-mode`)
- React re-renders styling based on theme

**Storage:** LocalStorage → `themeMode: "dark"` or `"light"`  
**Implementation Notes:**
- Provide CSS variables for colors:
  ```css
  :root {
    --bg-primary: #ffffff;
    --text-primary: #000000;
    ...
  }
  .dark-mode {
    --bg-primary: #1a1a1a;
    --text-primary: #ffffff;
    ...
  }
  ```
- On App load, read theme from LocalStorage and apply immediately (no flicker)
- Use `useEffect` in App.jsx to apply class on mount
- Update all components to use CSS variables

---

## Category 6: Content & Social Features

*No additional features in this category beyond Feature 22 (Ratings), which is already documented above.*

---

## Implementation Priority Matrix

### Phase 1: Foundation (High Priority, Low-Medium Complexity)
1. **F021** - Dark Mode / Light Mode (High impact, medium complexity)
2. **F009** - Bookmark Courses (High value, low complexity)
3. **F023** - Filters (High value, medium complexity)
4. **F024** - Details Pages (Required for other features, medium complexity)

### Phase 2: User Experience (Medium Priority)
5. **F022** - Ratings With Comments (High value, requires F024)
6. **F025** - Profile Editing (High value, requires backend)
7. **F019** - Notification Bell (Medium value, low complexity)
8. **F018** - Recently Viewed Services (Medium value, requires F024)

### Phase 3: Engagement Features (Lower Priority)
9. **F001** - Skill Seeds Pop-Ups
10. **F004** - Micro-Achievements
11. **F002** - Mood-Based Course Selector
12. **F005** - Manual Course Progress Bar
13. **F007** - Quick Price Calculator
14. **F014** - Build My Bundle

### Phase 4: Nice-to-Have (Low Priority)
15. **F003** - Sticky Notes
16. **F006** - Monthly "Draw This Chimp" Prompt
17. **F008** - Random Service Generator
18. **F010** - Secret Keyboard Easter Egg
19. **F011** - Profile Title Customizer
20. **F013** - Tiny On-Page Game
21. **F015** - Service Comparison Toggle
22. **F016** - "Level-Up Wheel" Animation
23. **F017** - Profile Color Themes
24. **F020** - Random Question Button

---

## Technical Dependencies

### Backend Changes Required

**New Database Tables:**
1. `reviews` (for Feature 22)
   ```sql
   CREATE TABLE reviews (
     id SERIAL PRIMARY KEY,
     user_email VARCHAR(255) NOT NULL,
     item_id INTEGER NOT NULL,
     item_type VARCHAR(50) NOT NULL,
     rating INTEGER CHECK (rating >= 1 AND rating <= 5),
     comment TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. `users` table updates (for Feature 25)
   ```sql
   ALTER TABLE users 
   ADD COLUMN username VARCHAR(255),
   ADD COLUMN avatar_url VARCHAR(500),
   ADD COLUMN title VARCHAR(100);
   ```

**New API Endpoints:**
- `GET /api/services/:id` - Get service details
- `GET /api/course-services/:id` - Get course details
- `GET /api/reviews/:itemType/:itemId` - Get reviews
- `POST /api/reviews` - Submit review
- `POST /api/update-profile` - Update user profile

### Frontend Dependencies

**New Packages (if needed):**
- `react-router-dom` (for Feature 24 - Details Pages)

**New Components to Create:**
1. `DetailsPage.jsx` (Feature 24)
2. `BookmarksPage.jsx` (Feature 9)
3. `NotificationBell.jsx` (Feature 19)
4. `ThemeToggle.jsx` (Feature 21)
5. `ReviewSection.jsx` (Feature 22)
6. `FilterPanel.jsx` (Feature 23)
7. `ProfileEditor.jsx` (Feature 25)

---

## Storage Strategy Summary

### LocalStorage Keys
- `savedSkillSeeds` - Array of saved tip IDs
- `chimpAchievements` - Object with achievement states
- `foundEasterEgg` - Boolean
- `bananaClicks` - Number
- `courseProgress:<courseID>` - Object with lesson progress
- `bookmarkedCourses` - Array of course IDs
- `userNotes:<email>` - String (notes text)
- `userTitle:<email>` - String (profile title)
- `userTheme` - String (theme name)
- `chimpNotifications` - Array of notification objects
- `themeMode` - String ("dark" or "light")
- `recentServices` - Array of recent service objects
- `lastFiltersUsed` - Object with filter states

### Database Tables
- `reviews` - User reviews and ratings
- `users` - Extended with username, avatar_url, title

---

## Notes for Implementation

1. **Start with Phase 1 features** - They provide the most value and are foundational
2. **Test LocalStorage limits** - Some browsers have 5-10MB limits
3. **Consider backend migration** - Some LocalStorage features (like notes, title) could move to DB later
4. **Mobile responsiveness** - Ensure all new UI components work on mobile
5. **Accessibility** - Add ARIA labels, keyboard navigation where applicable
6. **Performance** - Lazy load detail pages, optimize image loading
7. **Error handling** - Add try-catch for LocalStorage operations (quota exceeded, etc.)

---

## Feature Status Tracking

| Feature ID | Name | Status | Priority | Assigned To | Notes |
|------------|------|--------|----------|-------------|-------|
| F001 | Skill Seeds Pop-Ups | Pending | Medium | - | - |
| F002 | Mood-Based Course Selector | Pending | Medium | - | - |
| F003 | Sticky Notes | Pending | Low | - | - |
| F004 | Micro-Achievements | Pending | Medium | - | - |
| F005 | Course Progress Bar | Pending | Medium | - | Requires F024 |
| F006 | Monthly Prompt | Pending | Low | - | - |
| F007 | Price Calculator | Pending | Medium | - | - |
| F008 | Random Service Generator | Pending | Low | - | - |
| F009 | Bookmark Courses | Pending | High | - | - |
| F010 | Easter Egg | Pending | Low | - | - |
| F011 | Profile Title | Pending | Low | - | - |
| F013 | Banana Game | Pending | Low | - | - |
| F014 | Build My Bundle | Pending | Medium | - | - |
| F015 | Service Comparison | Pending | Low | - | - |
| F016 | Level-Up Wheel | Pending | Low | - | - |
| F017 | Color Themes | Pending | Low | - | - |
| F018 | Recently Viewed | Pending | Medium | - | Requires F024 |
| F019 | Notification Bell | Pending | Medium | - | - |
| F020 | Random Question | Pending | Low | - | - |
| F021 | Dark Mode | Pending | High | - | - |
| F022 | Ratings & Comments | Pending | High | - | Requires F024, Backend |
| F023 | Filters | Pending | High | - | - |
| F024 | Details Pages | Pending | High | - | Requires React Router |
| F025 | Profile Editing | Pending | High | - | Requires Backend |

---

*Last Updated: [Current Date]*  
*Document Version: 1.0*

