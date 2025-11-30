# Shadow of the Diagnosis - Medical Training Game

A multiplayer online medical training game where teams collaborate to diagnose a clinical case through multiple phases.

## Overview

"Shadow of the Diagnosis" is a gamified medical education platform designed for training medical students and professionals. Teams work through 7 phases:

1. **Phase 1 - Clue Collection**: Teams exchange or hack clues about the case
2. **Phases 2-4 - Medical Questions**: Teams buy answers to medical questions using points
3. **Phase 5 - Diagnosis**: Teams submit their final diagnosis
4. **Phase 6 - Reflection**: Teams share their analysis and learnings
5. **Phase 7 - Prise en Charge**: Teams propose a complete patient care plan

## Architecture

This is a full-stack multiplayer application:

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + SQLite + Socket.io
- **Real-time**: Socket.io for instant synchronization across all players

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:3001`

### 2. Start the Frontend

In a new terminal:

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### 3. Play the Game

- **Players**: Open `http://localhost:5173` and join a team
- **Admin**: Open `http://localhost:5173?admin=true` to control the game

## Project Structure

```
.
├── backend/                  # Node.js backend server
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── db/              # Database setup
│   │   ├── socket/          # Socket.io handlers
│   │   └── index.js         # Server entry point
│   ├── .env                 # Backend config
│   └── package.json
│
├── src/                     # React frontend
│   ├── components/
│   │   ├── admin/          # Admin panel
│   │   ├── lobby/          # Team selection
│   │   ├── phase1/         # Clue collection phase
│   │   ├── phase2/         # Question phase 2
│   │   ├── phase3/         # Question phase 3
│   │   ├── phase4/         # Question phase 4
│   │   ├── phase5/         # Diagnosis phase
│   │   ├── phase6/         # Reflection phase
│   │   └── phase7/         # Prise en charge phase
│   ├── services/
│   │   ├── api.ts          # Axios API client
│   │   └── socket.ts       # Socket.io client
│   ├── App.tsx             # Main app component
│   └── main.tsx
│
├── docs/
│   └── local_storage_map.md  # Migration documentation
│
├── .env                     # Frontend config
└── package.json
```

## Environment Variables

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3001/api
```

### Backend (`backend/.env`)
```env
PORT=3001
DATABASE_PATH=./game.db
NODE_ENV=development
ADMIN_SECRET=admin123
FRONTEND_URL=http://localhost:5173
```

## Game Mechanics

### Points System

- Teams start with **100 points**
- **Phase 1**: Hacking a clue costs **30 points**
- **Phases 2-4**: Buying answers costs **20-35 points** each
- **Phases 5-7**: Free submissions
- **Admin** can award bonus points for good comments and care plans

### Team Management

- Maximum **3 members** per team
- 4 teams by default (Équipe 1-4)
- Each team starts with a unique clue about the case

### Admin Controls

The admin can:
- Start the game from lobby
- Advance to the next phase
- Award bonus points to teams
- Reset the entire game

Access admin mode by adding `?admin=true` to the URL.

## API Documentation

See [backend/README.md](backend/README.md) for complete API and Socket.io documentation.

## Key Features

### Real-Time Multiplayer
- Instant synchronization across all connected players
- No page refresh needed
- Socket.io ensures everyone sees updates immediately

### Phase-Based Gameplay
- Structured learning experience through 7 distinct phases
- Admin-controlled progression prevents rushing
- Each phase builds on the previous one

### Gamification
- Point system encourages strategic thinking
- Clue trading adds collaboration
- Hacking mechanism adds competitive element
- Leaderboard creates friendly competition

### Admin Dashboard
- Full visibility of all teams
- Control game flow
- Award points for quality submissions
- Reset game for new sessions

## Development

### Frontend Development

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run typecheck  # Type checking
```

### Backend Development

```bash
cd backend
npm run dev        # Start with auto-reload
npm start          # Production mode
```

## Database

The backend uses SQLite for data persistence. The database is automatically initialized on first run with:

- Default teams and clues
- Empty session in lobby state
- All necessary tables

Database file: `backend/game.db` (configurable via `.env`)

## Technology Stack

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **TailwindCSS**: Styling
- **Axios**: HTTP client
- **Socket.io Client**: Real-time communication
- **Lucide React**: Icon library

### Backend
- **Node.js**: Runtime
- **Express**: Web framework
- **Better-SQLite3**: Embedded database
- **Socket.io**: WebSocket server
- **CORS**: Cross-origin support
- **Dotenv**: Environment configuration

## Migration from localStorage

This application was migrated from a localStorage-based system to a full online multiplayer architecture. See [docs/local_storage_map.md](docs/local_storage_map.md) for detailed migration documentation.

## Production Deployment

### Backend Deployment

1. Set production environment variables
2. Configure DATABASE_PATH for persistent storage
3. Add JWT authentication for admin endpoints
4. Configure CORS for your frontend domain
5. Add rate limiting
6. Use a process manager (PM2, systemd)

### Frontend Deployment

1. Update `.env` with production API URL
2. Run `npm run build`
3. Deploy `dist/` folder to static hosting (Vercel, Netlify, etc.)

### Recommended Architecture

```
Frontend (Vercel/Netlify) → Backend (VPS/Railway/Render) → SQLite DB
                          ↓
                     Socket.io (same server)
```

## Security Considerations

- Add authentication for admin endpoints in production
- Implement rate limiting on API routes
- Validate all user inputs
- Use HTTPS in production
- Configure CORS properly for production domain
- Consider using JWT for admin session management

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify Node.js version (18+)
- Check file permissions for database directory

### Frontend can't connect to backend
- Verify `VITE_API_URL` in `.env`
- Check if backend is running on port 3001
- Check browser console for CORS errors

### Socket.io not connecting
- Verify backend Socket.io server is running
- Check browser console for connection errors
- Ensure FRONTEND_URL is correct in backend `.env`

### Database errors
- Delete `backend/game.db` to reset database
- Check file permissions
- Verify SQLite3 is properly installed

## License

This project is for educational purposes.

## Credits

Developed for medical education and training purposes.
