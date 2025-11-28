# Architecture Overview

## Tech Stack (Current)
- **Frontend**: React 18 with Vite 5 for fast dev server and build pipeline.
- **Backend**: Node.js with Express 5 + CORS, running on port 4000 by default.
- **Data Layer**: In-memory JS objects (no database yet, per learning plan).

## Local Development Flow
1. Start the backend (`npm run dev` inside `backend/`) so `/api/status` is reachable.
2. Start the frontend (`npm run dev` inside `frontend/`) and open the Vite URL (usually `http://localhost:5173`).
3. Frontend calls the backend via `fetch('http://localhost:4000/api/status')`.

## Next Steps (when ready)
- Expand backend routes as new frontend pages need data.
- Introduce persistence (file or DB) once you are comfortable with the basics.
- Eventually containerize or deploy both services once stable.

