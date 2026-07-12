# InterviewX Backend

Node.js + Express + MongoDB API for InterviewX. Handles real user accounts (JWT auth),
persisted interview sessions, and AI-generated interview questions + feedback via Groq
(free tier, open-source models).

## Stack

- **Express** — REST API
- **MongoDB / Mongoose** — data storage (Users, InterviewSessions)
- **JWT** — stateless auth, sent as `Authorization: Bearer <token>`
- **Groq** — generates interview questions, scores answers, writes final reports
  (falls back to a static question bank / heuristic scoring if Groq is unreachable
  or rate-limited, so the product never breaks)

## 1. Get your free services

### MongoDB Atlas (free tier)
1. Sign up at https://www.mongodb.com/cloud/atlas/register
2. Create a free (M0) cluster
3. Database Access → add a database user + password
4. Network Access → allow access from anywhere (`0.0.0.0/0`) for now
5. Connect → "Drivers" → copy the connection string

### Groq (free tier, no credit card)
1. Sign up at https://console.groq.com
2. Go to API Keys → create a new key
3. Free tier covers prototyping (~30 requests/min). Plenty for development and demos.

## 2. Local setup

```bash
cd interviewx-backend
npm install
cp .env.example .env
# edit .env: paste your MongoDB URI, a random JWT secret, and your Groq API key
npm run dev
```

Generate a JWT secret quickly with:
```bash
openssl rand -hex 32
```

Server runs on `http://localhost:5000` by default. Check it's alive:
```bash
curl http://localhost:5000/health
```

## 3. API overview

All authenticated routes require `Authorization: Bearer <token>` header.

| Method | Route                          | Auth | Description                              |
|--------|--------------------------------|------|-------------------------------------------|
| POST   | `/api/auth/register`           | No   | Create account, returns token + user      |
| POST   | `/api/auth/login`              | No   | Login, returns token + user               |
| GET    | `/api/auth/me`                 | Yes  | Get current user                          |
| GET    | `/api/profile`                 | Yes  | Get profile                               |
| PUT    | `/api/profile`                 | Yes  | Update name/role/target/tracks/notifications |
| POST   | `/api/interviews`              | Yes  | Start a session (`{ trackId, role, level }`), AI-generates questions |
| GET    | `/api/interviews`               | Yes  | List your past sessions                  |
| GET    | `/api/interviews/:id`           | Yes  | Get one session                          |
| POST   | `/api/interviews/:id/answer`    | Yes  | Submit an answer (`{ answer }`), get score + feedback + next question |
| POST   | `/api/interviews/:id/complete`  | Yes  | Finalize session, AI-generates full report |

`trackId` must be one of: `technical`, `coding`, `cybersecurity`, `system-design`, `hr`.

## 4. Connecting the React frontend

In the frontend, replace the `localStorage`-based `AuthProvider` calls with real
`fetch`/`axios` calls to these endpoints, store the returned JWT (e.g. in
`localStorage` or memory + httpOnly cookie if you upgrade later), and send it
as the `Authorization` header on every authenticated request.

Set `CORS_ORIGIN` in `.env` to match wherever the frontend is running
(`http://localhost:5173` for local Vite dev, or your deployed frontend URL).

## 5. Deploying (Render / Railway)

Both work the same way:

1. Push this `interviewx-backend` folder to its own GitHub repo (or a subfolder of your monorepo)
2. Create a new **Web Service** on Render or Railway, point it at the repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add the same environment variables from `.env` in the dashboard's Environment/Variables section
6. Update `MONGODB_URI`'s Network Access in Atlas to allow your hosting provider's IPs
   (or keep `0.0.0.0/0` for simplicity while prototyping)
7. Once deployed, update `CORS_ORIGIN` to your real frontend URL, and update the
   frontend's API base URL to point at your new backend URL

## Notes

- Passwords are hashed with bcrypt, never stored in plaintext.
- Groq calls are wrapped in try/catch with graceful fallbacks everywhere — if the
  free tier rate limit is hit, the app keeps working with static questions and
  heuristic scoring instead of erroring out.
- This is a prototype-grade backend: no email verification, password reset,
  or refresh-token rotation yet. Good enough for a demo / early product, not
  yet hardened for a large-scale production launch.
