# Start Commands

Use the commands below to spin up both servers quickly. Each block is ready to copy/paste into PowerShell.

## Backend (API on port 4000)
```
cd "C:\cursor 2\backend"
npm run dev
```

## Frontend (Vite on port 5173)
```
cd "C:\cursor 2\frontend"
npm run dev
```

## Optional: launch both terminals automatically
```
cd "C:\cursor 2"
start powershell -NoExit -Command "cd '.\backend'; npm run dev"
start powershell -NoExit -Command "cd '.\frontend'; npm run dev"
```

