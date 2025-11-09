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
```

## Database

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
