# Local Storage Map - Shadow of the Diagnosis

## Executive Summary

This document provides a comprehensive analysis of all localStorage usage in the "Shadow of the Diagnosis" medical training game. The application currently uses browser localStorage for all data persistence with manual synchronization via storage events. This analysis maps each localStorage operation to prepare for migration to a Node.js + SQLite + Socket.io backend.

---

## Data Models

### 1. Team
**Location:** `src/lib/localStorage.ts:1-7`

```typescript
interface Team {
  id: string;           // Unique identifier (generated via Date.now() + random)
  name: string;         // Team name (e.g., "Équipe 1")
  points: number;       // Current point balance (starts at 100)
  clue: string;         // Accumulated clues (pipe-separated)
  members: string[];    // Array of member names (max 3)
}
```

**Storage Key:** `doctor_game_teams`

**Operations:**
- **Read:** `localStorage_api.getTeams()` - Returns all teams or empty array
- **Write:** `localStorage_api.setTeams(teams)` - Overwrites entire teams array
- **Initialize:** App.tsx:66-72 - Creates 4 default teams with CLUES[0-3]

**Used In:**
- `App.tsx:76` - Load on initialization
- `App.tsx:96` - Reload on storage events
- `App.tsx:108-117` - Join team (add member)
- `App.tsx:142-158` - Accept clue exchange (merge clues)
- `App.tsx:176-188` - Hack clue (deduct 30 points, steal clue)
- `App.tsx:195-212` - Buy answer (deduct points)
- `App.tsx:267-282` - Award points (admin)

**Business Logic:**
- Teams start with 100 points
- Each team gets one unique clue from CLUES array
- Clues are concatenated with " | " separator when exchanged/hacked
- Points are deducted for: buying answers (20-35 pts), hacking (30 pts)
- Points are added by admin in Phase 6
- Maximum 3 members per team

---

### 2. ClueExchange
**Location:** `src/lib/localStorage.ts:9-14`

```typescript
interface ClueExchange {
  id: string;                                      // Unique identifier
  fromTeamId: string;                              // Team initiating exchange
  toTeamId: string;                                // Target team
  status: 'pending' | 'accepted' | 'rejected';     // Exchange state
}
```

**Storage Key:** `doctor_game_exchanges`

**Operations:**
- **Read:** `localStorage_api.getExchanges()` - Returns all exchanges or empty array
- **Write:** `localStorage_api.setExchanges(exchanges)` - Overwrites entire exchanges array

**Used In:**
- `App.tsx:77` - Load on initialization
- `App.tsx:97` - Reload on storage events
- `App.tsx:120-132` - Create new exchange request (status: 'pending')
- `App.tsx:134-161` - Accept exchange (status: 'accepted', merge clues)
- `App.tsx:163-171` - Reject exchange (status: 'rejected')
- `Phase1.tsx:28-30` - Display pending exchanges for current team

**Business Logic:**
- Only exchanges with status='pending' and toTeamId=currentTeam are shown
- When accepted: both teams' clues are merged (if not already present)
- When rejected: status changes to 'rejected' (no clue transfer)
- Exchanges are never deleted, only status changes

---

### 3. PhaseAnswer
**Location:** `src/lib/localStorage.ts:16-22`

```typescript
interface PhaseAnswer {
  id: string;           // Unique identifier
  teamId: string;       // Team that purchased/submitted answer
  phase: number;        // Phase number (2-5)
  answer: string;       // Answer content
  pointsSpent: number;  // Points deducted (0 for Phase 5)
}
```

**Storage Key:** `doctor_game_answers`

**Operations:**
- **Read:** `localStorage_api.getAnswers()` - Returns all answers or empty array
- **Write:** `localStorage_api.setAnswers(answers)` - Overwrites entire answers array

**Used In:**
- `App.tsx:78` - Load on initialization
- `App.tsx:98` - Reload on storage events
- `App.tsx:192-213` - Buy answer for phases 2-4 (deduct points, store QUESTIONS[phase-2].answer)
- `App.tsx:215-228` - Submit diagnosis for Phase 5 (pointsSpent: 0)
- `App.tsx:355-356` - Check if team has answer for current phase
- `App.tsx:372` - Get diagnosis for Phase 5

**Business Logic:**
- Phases 2-4: Teams buy pre-defined answers (costs: 20, 25, 30, 35 points)
- Phase 5: Teams submit free-text diagnosis (no cost)
- One answer per team per phase
- Answer content:
  - Phases 2-4: QUESTIONS[phase-2].answer (pre-defined)
  - Phase 5: User-submitted diagnosis text

---

### 4. Comment
**Location:** `src/lib/localStorage.ts:24-29`

```typescript
interface Comment {
  id: string;            // Unique identifier
  teamId: string;        // Team that submitted comment
  comment: string;       // Comment text
  pointsAwarded: number; // Bonus points given by admin
}
```

**Storage Key:** `doctor_game_comments`

**Operations:**
- **Read:** `localStorage_api.getComments()` - Returns all comments or empty array
- **Write:** `localStorage_api.setComments(comments)` - Overwrites entire comments array

**Used In:**
- `App.tsx:79` - Load on initialization
- `App.tsx:99` - Reload on storage events
- `App.tsx:230-242` - Submit comment (pointsAwarded: 0)
- `App.tsx:274-279` - Admin awards points (update pointsAwarded)
- `App.tsx:384` - Get comment for current team in Phase 6
- `AdminPanel.tsx:186-207` - Display all comments with point awards

**Business Logic:**
- Phase 6 only: Teams submit reflective comments
- Admin can award bonus points for insightful comments
- Points are added to team's total when awarded
- One comment per team

---

### 5. GameSession
**Location:** `src/lib/localStorage.ts:31-34`

```typescript
interface GameSession {
  status: 'lobby' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5' | 'phase6' | 'finished';
  currentPhase: number;  // 0-6 (0=lobby, 1-6=phases)
}
```

**Storage Key:** `doctor_game_session`

**Operations:**
- **Read:** `localStorage_api.getSession()` - Returns session or default {status: 'lobby', currentPhase: 0}
- **Write:** `localStorage_api.setSession(session)` - Overwrites session

**Used In:**
- `App.tsx:62` - Load on initialization (with default)
- `App.tsx:75` - Set state
- `App.tsx:92` - Reload on storage events
- `App.tsx:244-248` - Start game (admin: phase1)
- `App.tsx:250-264` - Next phase (admin: increment phase)
- `App.tsx:324-429` - Route to appropriate component based on status

**Business Logic:**
- Game starts in 'lobby' (phase 0)
- Admin controls phase transitions
- Status values map to currentPhase: lobby=0, phase1=1, ..., phase6=6, finished=7
- All clients synchronize via storage events

---

### 6. SessionStorage: currentTeamId
**Location:** `App.tsx:81-85, 115`

**Key:** `currentTeamId`

**Purpose:** Persist team selection across page refreshes (per browser tab)

**Operations:**
- **Read:** `App.tsx:81` - Restore team on initialization
- **Write:** `App.tsx:115` - Save when joining team
- **Delete:** `App.tsx:288` - Clear on game reset

**Difference from localStorage:**
- Scoped to browser tab (not shared across tabs)
- Not cleared on resetGame localStorage wipe
- Must be manually cleared

---

## Storage Event Synchronization

**Mechanism:** `src/lib/localStorage.ts:52, 62, 72, 82, 92, 101`

Every setter dispatches a custom storage event:
```typescript
window.dispatchEvent(new Event('storage'));
```

**Listener:** `App.tsx:53-58`
```typescript
window.addEventListener('storage', handleStorageChange);
```

**Purpose:** Synchronize state across browser tabs when localStorage changes

**Limitations:**
- Only works within same browser on same machine
- No real-time sync across different devices
- Manual event dispatch required (native storage events don't fire in same tab)

---

## ID Generation

**Function:** `localStorage_api.generateId()` - `src/lib/localStorage.ts:104-106`

```typescript
generateId: (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
```

**Characteristics:**
- Time-based + random suffix
- Base36 encoding for shorter strings
- Not guaranteed globally unique (relies on timestamp + Math.random)
- No collision detection

**Used For:**
- Team IDs (initialization)
- ClueExchange IDs
- PhaseAnswer IDs
- Comment IDs

---

## Reset Functionality

**Function:** `localStorage_api.resetGame()` - `src/lib/localStorage.ts:95-102`

**Operations:**
1. Remove all 5 localStorage keys
2. Dispatch storage event
3. **Does NOT clear sessionStorage.currentTeamId** (must be done separately)

**Triggered By:** `App.tsx:285-291` - Admin panel "Réinitialiser le jeu" button

**Complete Reset:**
```typescript
localStorage_api.resetGame();
sessionStorage.removeItem('currentTeamId');
window.location.reload();
```

---

## Data Flow by Phase

### Pre-Game: Lobby
1. **Initialize:** Create 4 teams with default clues if none exist
2. **Join:** Players select team + name → update team.members
3. **Wait:** All players see lobby screen until admin starts game

### Phase 1: Collecte d'Indices
**Data Modified:**
- `ClueExchange`: Create exchange requests
- `ClueExchange`: Accept/reject exchanges
- `Team.clue`: Merge clues on accept
- `Team.points`: Deduct 30 points for hacking
- `Team.clue`: Add hacked clue

**Read-Only:**
- `Team` (for display)

### Phases 2-4: Questions Médicales
**Data Modified:**
- `PhaseAnswer`: Store purchased answer
- `Team.points`: Deduct answer cost (20, 25, 30, 35)

**Read-Only:**
- `Team` (for display)
- QUESTIONS array (hardcoded in App.tsx:18-39)

### Phase 5: Diagnostic Final
**Data Modified:**
- `PhaseAnswer`: Store user-submitted diagnosis (phase=5, pointsSpent=0)

**Read-Only:**
- `Team` (for display)

### Phase 6: Commentaire Final
**Data Modified:**
- `Comment`: Store user-submitted comment
- `Comment.pointsAwarded`: Admin awards bonus points
- `Team.points`: Add awarded points

**Read-Only:**
- `Team` (for display)

### Finished
**Read-Only:**
- `Team`: Display sorted leaderboard

---

## Admin Panel Data Access

**File:** `src/components/AdminPanel.tsx`

**Full Read Access:**
- All teams (for leaderboard, details)
- All comments (for review)
- Game session status

**Write Operations:**
1. **Start Game:** Set session to phase1
2. **Next Phase:** Increment session.currentPhase
3. **Award Points:**
   - Update Team.points
   - Update Comment.pointsAwarded for matching teamId
4. **Reset Game:** Clear all localStorage + reload

---

## Critical Migration Considerations

### 1. Concurrency Issues
**Current:** Last-write-wins (no conflict resolution)
**Problem:** Multiple tabs can overwrite each other's changes
**Solution:** Backend must handle concurrent operations atomically

### 2. Data Integrity
**Current:** No validation, no foreign key checks
**Examples:**
- ClueExchange.toTeamId might reference non-existent team
- PhaseAnswer.teamId might reference deleted team
**Solution:** Database foreign key constraints + validation

### 3. Transaction Boundaries
**Current:** Multi-step operations split across function calls
**Example:** Accept exchange (App.tsx:134-161)
1. Update exchange status
2. Find both teams
3. Update fromTeam.clue
4. Update toTeam.clue

**Problem:** Failure mid-operation leaves inconsistent state
**Solution:** Database transactions for atomic multi-table updates

### 4. Real-Time Sync
**Current:** Storage events only work in same browser
**Solution:** Socket.io for cross-device real-time updates

### 5. State Restoration
**Current:** sessionStorage.currentTeamId persists team selection
**Problem:** Doesn't sync with backend, can become stale
**Solution:** Server-side session management or JWT-based authentication

---

## Proposed Backend Schema

### Tables

#### `teams`
```sql
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 100,
  clue TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `team_members`
```sql
CREATE TABLE team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL,
  member_name TEXT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);
```

#### `clue_exchanges`
```sql
CREATE TABLE clue_exchanges (
  id TEXT PRIMARY KEY,
  from_team_id TEXT NOT NULL,
  to_team_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (to_team_id) REFERENCES teams(id) ON DELETE CASCADE
);
```

#### `phase_answers`
```sql
CREATE TABLE phase_answers (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  phase INTEGER NOT NULL,
  answer TEXT NOT NULL,
  points_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE(team_id, phase)
);
```

#### `comments`
```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  comment TEXT NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE(team_id)
);
```

#### `game_session`
```sql
CREATE TABLE game_session (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  status TEXT NOT NULL DEFAULT 'lobby',
  current_phase INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Socket.io Events Mapping

### Client → Server

| Event | Data | Triggered By | localStorage Equivalent |
|-------|------|--------------|------------------------|
| `team:join` | `{teamId, memberName}` | TeamSelection submit | `setTeams()` + `setItem('currentTeamId')` |
| `exchange:create` | `{fromTeamId, toTeamId}` | Phase1 exchange button | `setExchanges()` |
| `exchange:accept` | `{exchangeId}` | Phase1 accept button | `setExchanges()` + `setTeams()` |
| `exchange:reject` | `{exchangeId}` | Phase1 reject button | `setExchanges()` |
| `clue:hack` | `{fromTeamId, targetTeamId}` | Phase1 hack button | `setTeams()` |
| `answer:buy` | `{teamId, phase, cost}` | QuestionPhase buy button | `setAnswers()` + `setTeams()` |
| `diagnosis:submit` | `{teamId, diagnosis}` | Phase5 submit | `setAnswers()` |
| `comment:submit` | `{teamId, comment}` | Phase6 submit | `setComments()` |
| `admin:startGame` | `{}` | Admin start button | `setSession()` |
| `admin:nextPhase` | `{}` | Admin next button | `setSession()` |
| `admin:awardPoints` | `{teamId, points}` | Admin award button | `setTeams()` + `setComments()` |
| `admin:resetGame` | `{}` | Admin reset button | `resetGame()` |

### Server → Client

| Event | Data | Triggers | localStorage Equivalent |
|-------|------|----------|------------------------|
| `teams:updated` | `{teams: Team[]}` | Any team modification | `getTeams()` after storage event |
| `exchanges:updated` | `{exchanges: ClueExchange[]}` | Any exchange operation | `getExchanges()` after storage event |
| `answers:updated` | `{answers: PhaseAnswer[]}` | Any answer operation | `getAnswers()` after storage event |
| `comments:updated` | `{comments: Comment[]}` | Any comment operation | `getComments()` after storage event |
| `session:updated` | `{session: GameSession}` | Phase change | `getSession()` after storage event |
| `game:reset` | `{}` | Admin reset | Reload page |

---

## API Endpoints Mapping

### GET Endpoints

| Endpoint | Returns | localStorage Equivalent |
|----------|---------|------------------------|
| `GET /api/teams` | `Team[]` | `getTeams()` |
| `GET /api/teams/:id` | `Team` | `getTeams().find(t => t.id === id)` |
| `GET /api/exchanges` | `ClueExchange[]` | `getExchanges()` |
| `GET /api/answers` | `PhaseAnswer[]` | `getAnswers()` |
| `GET /api/comments` | `Comment[]` | `getComments()` |
| `GET /api/session` | `GameSession` | `getSession()` |

### POST Endpoints

| Endpoint | Body | Returns | localStorage Equivalent |
|----------|------|---------|------------------------|
| `POST /api/teams/:id/join` | `{memberName}` | `Team` | Join team logic |
| `POST /api/exchanges` | `{fromTeamId, toTeamId}` | `ClueExchange` | Create exchange |
| `POST /api/exchanges/:id/accept` | `{}` | `{exchange, teams}` | Accept exchange |
| `POST /api/exchanges/:id/reject` | `{}` | `ClueExchange` | Reject exchange |
| `POST /api/teams/:id/hack` | `{targetTeamId}` | `{fromTeam, targetTeam}` | Hack clue |
| `POST /api/answers` | `{teamId, phase, answer, pointsSpent}` | `PhaseAnswer` | Buy/submit answer |
| `POST /api/comments` | `{teamId, comment}` | `Comment` | Submit comment |
| `POST /api/session/start` | `{}` | `GameSession` | Start game |
| `POST /api/session/next` | `{}` | `GameSession` | Next phase |
| `POST /api/admin/award-points` | `{teamId, points}` | `{team, comment}` | Award points |
| `POST /api/admin/reset` | `{}` | `{}` | Reset game |

---

## Migration Checklist

### Phase 1: Backend Setup
- [ ] Initialize Node.js + Express + TypeScript project
- [ ] Install dependencies: `better-sqlite3`, `socket.io`, `cors`, `dotenv`
- [ ] Create SQLite database with schema above
- [ ] Implement database initialization with seed data (4 teams + default clues)

### Phase 2: API Implementation
- [ ] Implement all GET endpoints
- [ ] Implement all POST endpoints with transaction support
- [ ] Add error handling and validation
- [ ] Test all endpoints with Postman/Thunder Client

### Phase 3: Socket.io Integration
- [ ] Setup Socket.io server
- [ ] Implement all client→server event handlers
- [ ] Implement all server→client event broadcasts
- [ ] Test real-time synchronization

### Phase 4: Frontend Refactoring
- [ ] Create API service layer (replace localStorage_api)
- [ ] Create Socket.io client service
- [ ] Update App.tsx to use API + sockets
- [ ] Remove all localStorage operations
- [ ] Remove storage event listener
- [ ] Test all phases end-to-end

### Phase 5: Testing & Deployment
- [ ] Multi-device testing
- [ ] Concurrent operation testing
- [ ] Error recovery testing
- [ ] Performance testing
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Update environment variables

---

## Backward Compatibility Notes

If gradual migration is needed:

1. **Dual-Write Pattern:** Write to both localStorage and backend
2. **Feature Flag:** Toggle between localStorage and backend via environment variable
3. **Data Migration Script:** Export localStorage data to backend format

**Not Recommended:** Mixing localStorage and backend in production leads to data inconsistency

---

## Security Considerations

### Current localStorage Approach
- No authentication
- All data client-side (visible in DevTools)
- Admin panel accessible via URL parameter
- No access control

### Backend Requirements
- Implement JWT-based authentication for admin endpoints
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- CORS configuration for production
- Environment variable for admin secret

---

## Performance Considerations

### Current Bottlenecks
1. Full array read/write on every operation
2. No pagination
3. No caching strategy
4. Redundant data loading on storage events

### Backend Optimizations
1. Indexed database queries
2. Pagination for large datasets
3. Redis caching for frequently accessed data
4. Optimistic updates on client
5. Debounced socket emissions

---

## Appendix: Full localStorage Keys

| Key | Type | Default | Cleared on Reset |
|-----|------|---------|------------------|
| `doctor_game_teams` | Team[] | [] | ✓ |
| `doctor_game_exchanges` | ClueExchange[] | [] | ✓ |
| `doctor_game_answers` | PhaseAnswer[] | [] | ✓ |
| `doctor_game_comments` | Comment[] | [] | ✓ |
| `doctor_game_session` | GameSession | {status:'lobby', currentPhase:0} | ✓ |
| `currentTeamId` (sessionStorage) | string | undefined | ✗ (manual clear) |

---

## Document Metadata

- **Created:** 2025-11-04
- **Author:** System Analysis
- **Version:** 1.0
- **Purpose:** Backend migration planning for Shadow of the Diagnosis
- **Status:** Complete analysis for migration to Node.js + SQLite + Socket.io
