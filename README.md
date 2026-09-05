# WithMe — Full-Stack Friendship, Collaboration, and Teammate Discovery Platform

> **"Find people who want to do the same things you do."**

WithMe is a full-stack web application that helps people find compatible peers to **study, build projects, play games, practice skills, pursue hobbies, and participate in shared-interest activities together**.

---

## 🌟 Key Features

### 1. Transparent Compatibility Algorithm
- Real backend matching engine weighing:
  - **Shared Interests** (25%)
  - **Shared Goals** (20%)
  - **Activity Compatibility** (Online / In-Person / Group Size) (20%)
  - **Skills Synergy** (10%)
  - **Availability Overlap** (10%)
  - **Location Proximity** (15%)
- Transparent score breakdown on every user profile card (interests, goals, skills, distance bucket).

### 2. Privacy-First Nearby Map Discovery
- **Zero Raw Coordinates Leaked:** Exact GPS points are deterministically fuzzed with jitter (~500m–1.5km) and bucketed (`<2 km`, `2–5 km`, `5–10 km`, `10–25 km`).
- Interactive Leaflet dark mode map synced in real-time with nearby people and physical activities.
- Distance radius presets (1 km, 5 km, 10 km, 25 km, 50 km).

### 3. Comprehensive Collaboration Hub
- **Activities:** In-person study sprints, football matches, coding sessions, and book clubs with participant quotas and attendee rosters.
- **Projects:** Team recruitment boards with stage badges (Idea, Prototype, MVP, Launched) and required role matching.
- **Guilds & Communities:** Community discussion feeds and member timelines.

### 4. Voluntary Contact Sharing & Direct Chat
- Real-time conversational messaging.
- **Voluntary Contact Cards:** Users explicitly opt in to share Telegram, Discord, Email, GitHub, or Phone numbers per connection.
- Safety controls: Report, Block, and granular Location discovery controls.

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** (Linear/Notion-inspired modern dark theme)
- **Framer Motion** (Micro-interactions, modal spring physics, tab animations)
- **TanStack Query v5** (Server state synchronization)
- **React Hook Form** + **Zod** (Form validation)
- **Leaflet** + **React-Leaflet** (Interactive privacy map)
- **Lucide React** (Icons)

### Backend
- **Python Flask** (Service + Repository architecture)
- **SQLAlchemy ORM** (SQLite default / PostgreSQL compatible)
- **PyJWT** (Access and refresh token auth flow)
- **Bcrypt** (Secure password hashing)

---

## 🚀 Quick Start

### 1. Run the Backend
```bash
# In the project root:
cd backend
python -m pip install -r requirements.txt
python seed.py
python run.py
```
*Backend runs at `http://localhost:5000` with pre-seeded mock users and initial data.*

### 2. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:3000` with automatic API proxying to port 5000.*

### 3. Run with Docker Compose
```bash
docker compose up --build
```

---

## 👥 Demo Credentials
You can log in directly using the demo buttons on the Login page, or use:

| User | Username | Password | Focus |
|---|---|---|---|
| **Alex Chen** | `alex_chen` | `password123` | Frontend Engineer & AI Hacker |
| **Sarah Kim** | `sarah_kim` | `password123` | SAT Math Prep 800 Aspirant |
| **Elena Rostova** | `elena_rostova` | `password123` | IELTS Speaking & Book Club |
| **Marcus Vance** | `marcus_v` | `password123` | Indie Game Dev (Unity C#) |

---

## 📁 Project Structure
```text
├── backend/
│   ├── app/
│   │   ├── models/            # SQLAlchemy database models
│   │   ├── repositories/      # Data access layer
│   │   ├── services/          # Matching engine & privacy service
│   │   ├── routes/            # REST API blueprints
│   │   └── utils/             # JWT and Haversine math
│   ├── seed.py                # Populates 20+ realistic profiles & social graph
│   └── test_api.py            # Integration test suite
├── frontend/
│   ├── src/
│   │   ├── components/        # UI primitives, cards, and Leaflet map
│   │   ├── context/           # Auth and Location providers
│   │   ├── pages/             # All 19+ application routes
│   │   ├── types/             # TypeScript domain models
│   │   └── routes/            # Protected route navigation
└── README.md
```
