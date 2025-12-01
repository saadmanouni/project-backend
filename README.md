<<<<<<< HEAD
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
=======
# Shadow of the Diagnosis - Backend

Backend multiplayer server for the medical training game "Shadow of the Diagnosis".

## Technologies

- Node.js + Express
- SQLite3 (better-sqlite3)
- Socket.io for real-time communication
- CORS enabled for frontend communication

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (optional):
Edit `.env` file if needed. Default values:
- `PORT=3001`
- `DATABASE_PATH=./game.db`
- `FRONTEND_URL=http://localhost:5173`

## Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
>>>>>>> ca43c40f3ae77bd97fe14ccb34ffe9e3ca56c746
```

## Database

<<<<<<< HEAD
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
=======
The database is automatically initialized on first run with:
- 4 default teams (Équipe 1-4)
- Each team starts with 100 points and one unique clue
- Session table initialized to lobby state

The SQLite database file is created at `./game.db` (or path specified in `.env`).

## API Endpoints

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams/:id/join` - Join team with member name
- `POST /api/teams/:id/update-points` - Update team points

### Exchanges
- `GET /api/exchanges` - Get all clue exchanges
- `POST /api/exchanges` - Create new exchange request
- `POST /api/exchanges/:id/accept` - Accept exchange (merges clues)
- `POST /api/exchanges/:id/reject` - Reject exchange

### Clues
- `POST /api/clues/hack` - Hack another team's clue (costs 30 points)

### Answers
- `GET /api/answers` - Get all phase answers
- `POST /api/answers` - Submit answer for phase

### Comments
- `GET /api/comments` - Get all comments
- `POST /api/comments` - Submit comment (Phase 6)
- `POST /api/comments/:id/award-points` - Award points for comment

### Prise en Charge (Phase 7)
- `GET /api/prise-en-charge` - Get all prise en charge submissions
- `POST /api/prise-en-charge` - Submit prise en charge
- `POST /api/prise-en-charge/:id/award-points` - Award points

### Session
- `GET /api/session` - Get current game session
- `POST /api/session/start` - Start game (admin)
- `POST /api/session/next-phase` - Move to next phase (admin)
- `POST /api/session/reset` - Reset entire game (admin)

### Health
- `GET /api/health` - Server health check

## Socket.io Events

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `team:join` | `{teamId, memberName}` | Join a team |
| `exchange:create` | `{fromTeamId, toTeamId}` | Create exchange request |
| `exchange:accept` | `{exchangeId}` | Accept exchange |
| `exchange:reject` | `{exchangeId}` | Reject exchange |
| `clue:hack` | `{fromTeamId, targetTeamId}` | Hack clue |
| `answer:buy` | `{teamId, phase, answer, pointsSpent}` | Buy answer |
| `diagnosis:submit` | `{teamId, diagnosis}` | Submit diagnosis |
| `comment:submit` | `{teamId, comment}` | Submit comment |
| `priseEnCharge:submit` | `{teamId, content}` | Submit prise en charge |
| `admin:startGame` | `{}` | Start game |
| `admin:nextPhase` | `{}` | Next phase |
| `admin:awardPoints` | `{teamId, points, commentId?, priseId?}` | Award points |
| `admin:resetGame` | `{}` | Reset game |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `teams:updated` | `Team[]` | Teams data changed |
| `exchanges:updated` | `ClueExchange[]` | Exchanges changed |
| `answers:updated` | `PhaseAnswer[]` | Answers changed |
| `comments:updated` | `Comment[]` | Comments changed |
| `priseEnCharge:updated` | `PriseEnCharge[]` | Prise en charge changed |
| `session:updated` | `GameSession` | Game phase changed |
| `game:reset` | `{}` | Game was reset |

## Database Schema

### teams
- `id` TEXT PRIMARY KEY
- `name` TEXT NOT NULL
- `points` INTEGER DEFAULT 100
- `clue` TEXT DEFAULT ''
- `created_at` DATETIME

### team_members
- `id` INTEGER PRIMARY KEY
- `team_id` TEXT FK → teams(id)
- `member_name` TEXT NOT NULL
- `joined_at` DATETIME

### clue_exchanges
- `id` TEXT PRIMARY KEY
- `from_team_id` TEXT FK → teams(id)
- `to_team_id` TEXT FK → teams(id)
- `status` TEXT CHECK(pending/accepted/rejected)
- `created_at` DATETIME
- `updated_at` DATETIME

### phase_answers
- `id` TEXT PRIMARY KEY
- `team_id` TEXT FK → teams(id)
- `phase` INTEGER NOT NULL
- `answer` TEXT NOT NULL
- `points_spent` INTEGER DEFAULT 0
- `created_at` DATETIME
- UNIQUE(team_id, phase)

### comments
- `id` TEXT PRIMARY KEY
- `team_id` TEXT FK → teams(id)
- `comment` TEXT NOT NULL
- `points_awarded` INTEGER DEFAULT 0
- `created_at` DATETIME
- UNIQUE(team_id)

### prise_en_charge
- `id` TEXT PRIMARY KEY
- `team_id` TEXT FK → teams(id)
- `content` TEXT NOT NULL
- `points_awarded` INTEGER DEFAULT 0
- `created_at` DATETIME
- UNIQUE(team_id)

### game_session
- `id` INTEGER PRIMARY KEY CHECK(id=1)
- `status` TEXT DEFAULT 'lobby'
- `current_phase` INTEGER DEFAULT 0
- `updated_at` DATETIME

## Game Flow

1. **Lobby**: Teams join, wait for admin to start
2. **Phase 1**: Clue collection (exchange/hack)
3. **Phases 2-4**: Medical questions (buy answers)
4. **Phase 5**: Submit diagnosis
5. **Phase 6**: Submit reflective comment
6. **Phase 7**: Submit prise en charge plan
7. **Finished**: Display final leaderboard

## Admin Functions

Access admin panel by adding `?admin=true` to URL or navigating to `/admin`.

Admin can:
- Start the game
- Progress through phases
- Award points to teams
- Reset the entire game

## Security Notes

- Admin endpoints should be protected in production
- CORS is currently open for development
- No authentication implemented (add JWT for production)
- Rate limiting should be added for production

## Port Configuration

Default: `3001`

Make sure frontend is configured to connect to this port (`.env` file: `VITE_API_URL=http://localhost:3001/api`)
>>>>>>> ca43c40f3ae77bd97fe14ccb34ffe9e3ca56c746
