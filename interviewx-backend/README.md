# InterviewX Backend

Express + MongoDB backend for InterviewX.

This backend currently supports:
- JWT authentication
- Google OAuth
- email verification + password reset emails via Resend
- regular interview sessions
- DSA interview sessions with JDoodle-backed code execution proxy
- aptitude tracks from a curated question bank
- Stripe checkout + webhook sync + billing portal foundations
- team model + team membership foundations
- backend-enforced daily session limits
- rate limiting

## Current scoring architecture

### Regular interview tracks
Groq is limited to a maximum of **2 calls per regular session**:
1. `scoreIntro()`
2. `batchScoreAnswers()`

Question generation comes from curated banks.
Final reports are calculated mathematically.

### DSA tracks
DSA questions remain structured objects serialized as JSON strings in MongoDB.
Answers are batch-evaluated at completion.

### Aptitude tracks
Aptitude questions come from a curated structured bank.
They use deterministic scoring from correct answers and explanations.
No extra Groq calls are introduced for aptitude.

---

## Stack

- **Node.js / Express 4**
- **MongoDB / Mongoose**
- **JWT**
- **bcryptjs**
- **passport-google-oauth20**
- **Groq** (`llama-3.3-70b-versatile` by default)
- **Resend**
- **JDoodle** backend proxy
- **Stripe** via backend API calls
- **express-rate-limit**

---

## Local backend setup

```bash
cd interviewx-backend
npm install
cp .env.example .env
npm run dev
```

Generate a JWT secret quickly with:

```bash
openssl rand -hex 32
```

Default local backend URL:

```txt
http://localhost:5000
```

Health check:

```bash
curl http://localhost:5000/health
```

---

## Environment variables

Use `interviewx-backend/.env.example` as the source of truth.

### Required in all environments

- `MONGODB_URI`
- `JWT_SECRET`
- `GROQ_API_KEY`

### Required in production

- `CORS_ORIGIN`
- `APP_URL`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `JDOODLE_CLIENT_ID`
- `JDOODLE_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_PRO`
- `STRIPE_PRICE_ID_TEAM`

### Optional

- `PORT`
- `JWT_EXPIRES_IN`
- `GROQ_MODEL`
- `STRIPE_CHECKOUT_SUCCESS_URL`
- `STRIPE_CHECKOUT_CANCEL_URL`

### Important notes

- `CORS_ORIGIN` may be a single origin or a comma-separated list.
- `APP_URL` must be your frontend base URL.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` must be set together.
- `JDOODLE_CLIENT_ID` and `JDOODLE_CLIENT_SECRET` must be set together.
- Never expose backend secrets in the frontend.

---

## Frontend deployment contract

The frontend uses exactly one required environment variable:

```txt
VITE_API_URL
```

See:
- `interviewx-frontend/.env.example`

### Local example

```txt
VITE_API_URL=http://localhost:5000
```

### Production example

```txt
VITE_API_URL=https://your-backend-production-domain.up.railway.app
```

### Important frontend/backend alignment

For production to work correctly:
- frontend on **Vercel** must point `VITE_API_URL` to the **Railway backend URL**
- backend `APP_URL` must point to the **Vercel frontend URL**
- backend `CORS_ORIGIN` must include the **Vercel frontend URL**

---

## OAuth production alignment

InterviewX uses backend-driven Google OAuth.

### Backend env

Set:

```txt
APP_URL=https://your-frontend.vercel.app
GOOGLE_CALLBACK_URL=https://your-backend.up.railway.app/api/auth/google/callback
```

### Google Cloud Console

Configure the Google OAuth app with:
- **Authorized redirect URI**:
  - `https://your-backend.up.railway.app/api/auth/google/callback`

The backend completes OAuth and then redirects users back to:

```txt
${APP_URL}/auth/google/success?token=...
```

So your deployed frontend URL and backend callback URL must both be correct.

---

## Stripe production alignment

InterviewX currently supports:
- Pro checkout
- Team checkout foundation
- webhook sync
- billing portal foundations

### Backend env

Set at minimum:

```txt
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_TEAM=price_...
```

Optional explicit redirects:

```txt
STRIPE_CHECKOUT_SUCCESS_URL=https://your-frontend.vercel.app/app?checkout=success&session_id={CHECKOUT_SESSION_ID}
STRIPE_CHECKOUT_CANCEL_URL=https://your-frontend.vercel.app/app?checkout=cancelled
```

If you omit them, the backend falls back to `APP_URL`.

### Stripe Dashboard setup

Create a webhook endpoint pointing to:

```txt
https://your-backend.up.railway.app/api/payments/webhook
```

Use the signing secret from Stripe as:

```txt
STRIPE_WEBHOOK_SECRET
```

### Billing portal / return flow

The backend returns billing portal sessions that send users back to frontend profile routes, so `APP_URL` must always match the deployed frontend domain.

---

## JDoodle production alignment

The frontend never talks to JDoodle directly.
Only the backend uses:
- `JDOODLE_CLIENT_ID`
- `JDOODLE_CLIENT_SECRET`

Make sure both are configured in Railway before using the DSA run-code flow in production.

---

## Resend production alignment

To send real production emails:
- configure `RESEND_API_KEY`
- use a verified sender/domain in `EMAIL_FROM`

Examples of email flows currently supported:
- verify email
- password reset
- team invite email foundations

---

## MongoDB Atlas production alignment

Use a production Atlas URI in:

```txt
MONGODB_URI
```

Also verify:
- database user credentials are correct
- Atlas network access allows Railway connectivity

---

## Railway backend deployment checklist

1. Deploy `interviewx-backend` as a Railway service.
2. Set start command:

```txt
npm start
```

3. Add all production backend environment variables.
4. Confirm Railway public backend URL.
5. Update:
- `APP_URL`
- `CORS_ORIGIN`
- `GOOGLE_CALLBACK_URL`
- Stripe webhook endpoint in Stripe dashboard

6. Test:
- `/health`
- register/login
- Google login
- password reset email
- Pro checkout
- webhook delivery
- billing portal
- DSA run-code flow

---

## Vercel frontend deployment checklist

1. Deploy `interviewx-frontend` to Vercel.
2. Set:

```txt
VITE_API_URL=https://your-backend.up.railway.app
```

3. Redeploy frontend after env changes.
4. Verify:
- auth works
- interview creation works
- reports load
- checkout redirects work
- Google OAuth lands back correctly

---

## Rate limiting / proxy notes

The backend is configured with rate limiting and proxy awareness for production.
Because Railway sits behind a proxy, the app uses `trust proxy` so IP-based rate limiting behaves correctly.

The Stripe webhook route is intentionally excluded from general API rate limiting so webhook delivery is not broken.

---

## API overview (high level)

All authenticated routes require:

```txt
Authorization: Bearer <token>
```

Key route groups:
- `/api/auth/*`
- `/api/profile`
- `/api/interviews/*`
- `/api/run`
- `/api/payments/*`
- `/api/team/*`

---

## Validation commands

Backend syntax check:

```bash
node --check src/config/env.js
```

Frontend production build:

```bash
cd ../interviewx-frontend
npm run build
```

---

## Important implementation notes

- DSA questions must remain structured objects serialized as JSON strings in MongoDB.
- Groq usage must remain capped at 2 calls per regular interview session.
- The backend is the source of truth for billing and session-limit enforcement.
- Never trust the frontend to activate paid plans.
- Team billing should be driven by the Team model and team Stripe subscription state.

---

## Monorepo deployment summary

### Vercel
Deploy:
- `interviewx-frontend`

Needs:
- `VITE_API_URL`

### Railway
Deploy:
- `interviewx-backend`

Needs:
- all backend production env vars

### MongoDB Atlas
Provides:
- production database via `MONGODB_URI`

---

## Current readiness summary

InterviewX now has:
- working auth
- working regular interview room
- working DSA room
- working aptitude tracks
- Stripe checkout foundation
- Stripe webhook sync foundation
- billing portal foundation
- team foundations
- backend session limits
- backend rate limiting

The main remaining work after deployment hardening is around:
- deeper Team billing lifecycle polish
- tests
- account deletion flow
- further UX refinement
