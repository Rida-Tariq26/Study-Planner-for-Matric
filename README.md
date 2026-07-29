# StudyGuide – AI Study Planner for Matric Students

A premium web application tailored for Pakistani Matric (9th and 10th Grade) students. It uses a personalised onboarding flow to generate flexible study schedules, mock tests, revision tracking, and an AI Mentor chat system.

## Features

- **Supabase Authentication**: Register with username, email, and password. Email verification link, forgot-password reset, and secure session persistence.
- **Username or Email Login**: Sign in with either your username or registered email address.
- **Tailored Onboarding**: Pakistani educational boards (FBISE, Punjab Board, Sindh Board, etc.), grade, stream (Science Bio/CS or Arts), study hours, environment, and target grades.
- **Intelligent Planner**: Board-syllabus-based daily tasks, revision sessions, and mock test scheduling.
- **AI Mentor**: Gemini-powered chat when you add your own API key (stored locally in your browser only), with a built-in rule-based fallback.
- **Visual Analytics**: Weekly study charts, streaks, and syllabus completion tracking.
- **Responsive UI**: Dark/light mode, mobile bottom nav, slide-out sidebar drawer, and toast notifications.

## Prerequisites

1. A [Supabase](https://supabase.com) project (free tier works).
2. Run the SQL migration in **Supabase → SQL Editor**:

   ```
   supabase_migration.sql
   ```

3. In **Supabase → Authentication → URL Configuration**, set:
   - **Site URL** to your deployed app URL (or `http://localhost:5500` for local testing).
   - **Redirect URLs** to include your app URL for email confirmation and password reset.

4. Ensure **Confirm email** is enabled under Authentication → Providers → Email (recommended for production).

## Configuration

Update Supabase credentials in `js/auth.js`:

```javascript
const SUPABASE_URL      = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

> The anon key is safe to expose in frontend code. Row Level Security (RLS) protects user data.

## How to Run Locally

**Option A – Live Server (recommended)**

```bash
npx serve .
# or use VS Code / Cursor Live Server extension
```

**Option B – Direct file open**

Open `index.html` in a browser. Some features (auth redirects) work best over `http://` rather than `file://`.

## Deployment

This is a static site. Deploy to any static host:

| Platform | Steps |
|----------|-------|
| **Netlify** | Drag-and-drop the project folder, or connect your Git repo. |
| **Vercel** | Import repo → framework preset: Other → output: `.` |
| **GitHub Pages** | Push to repo → Settings → Pages → deploy from `main` branch. |

After deploying, update Supabase **Site URL** and **Redirect URLs** to match your live domain.

## Project Structure

```
index.html          Main app shell
style.css           Design system & responsive layout
js/
  auth.js           Supabase authentication
  storage.js        Cloud sync (Supabase PostgreSQL)
  app.js            Routing, onboarding, auth flows
  ui.js             Dashboard UI, toasts, modals
  coach.js          Schedule generator & AI mentor
  data.js           Boards, subjects, syllabus data
supabase_migration.sql   Database schema + RLS policies
```

## Data & Privacy

- Study data (profile, tasks, tests, chat history) is stored in Supabase per user, protected by Row Level Security.
- Your Gemini API key is saved **only in your browser's localStorage** — it is never uploaded to the database.
- Passwords are handled entirely by Supabase Auth (bcrypt hashed server-side).

## License

Built as an educational project for Matric students in Pakistan.
