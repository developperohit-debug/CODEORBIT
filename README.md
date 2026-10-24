# CodeOrbit

**A full-stack developer learning platform** — track your DSA progress, follow
web-development roadmaps, discover contests and hackathons, connect with a
developer community, and manage everything from an admin dashboard.

Created and managed by Rohit.

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Technology Stack](#technology-stack)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [Migration Instructions](#migration-instructions)
8. [Authentication Provider Setup](#authentication-provider-setup)
9. [Local Development](#local-development)
10. [Deployment](#deployment)
11. [Administrator Account Setup](#administrator-account-setup)
12. [Project Structure](#project-structure)
13. [Known Limitations](#known-limitations)
14. [Planned Future Enhancements](#planned-future-enhancements)
15. [License](#license)

---

## Product Overview

CodeOrbit brings together everything a developer needs to grow in one place:

- **DSA Tracker** — browse problems by topic and difficulty, mark your solving
  status, bookmark problems for later, and get rule-based recommendations on
  what to practise next.
- **Web Dev Roadmaps** — follow structured, multi-phase learning paths with
  individual lessons, estimated durations, and progress tracking.
- **Opportunities** — discover upcoming contests and hackathons with
  eligibility details, prize info, and registration links. Bookmark the ones
  you want to revisit.
- **Community** — a developer directory to find peers by college or name, view
  public profiles, and start private conversations.
- **Discussions** — ask questions, share knowledge, upvote useful posts, and
  bookmark threads for later.
- **Real-time Messaging** — private one-to-one conversations with live message
  delivery.
- **Admin Dashboard** — manage problems, events, roadmaps, announcements, and
  users; resolve content reports; and view platform-wide analytics.
- **Analytics** — personal charts showing your weekly activity and topic
  coverage.

A "created and managed by Rohit" badge is displayed in the bottom-right corner
of every page.

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 13.5 (App Router) with TypeScript |
| UI | Tailwind CSS, shadcn/ui, Radix UI, Lucide icons |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL, Auth, Realtime) |
| Security | Row Level Security (RLS) on every table |
| Runtime | Vercel / Node 18+ |

## Prerequisites

- **Node.js 18+** and npm
- A **Supabase** project (free tier works) — create one at
  [supabase.com](https://supabase.com)
- (Optional) A Google OAuth client if you want the "Continue with Google"
  button to work — email/password auth works out of the box.

## Installation

```bash
git clone <your-repo-url> codeorbit
cd codeorbit
npm install
```

## Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (Project Settings → API → Project URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key (Project Settings → API → Project API keys → `anon`) |

Both values are safe to expose to the browser — the `anon` key is designed to
be public and is protected by RLS policies at the database level.

## Database Setup

The database schema, seed content, and RPC functions are applied through
Supabase migrations. All 25 tables use Row Level Security so the anon key can
only ever touch data the signed-in user owns (or public content).

### Tables created

| Category | Tables |
|---|---|
| User data | `profiles`, `user_preferences`, `user_problem_progress`, `problem_bookmarks`, `learning_notes`, `user_lesson_progress` |
| Learning content | `dsa_topics`, `dsa_problems`, `roadmaps`, `roadmap_phases`, `roadmap_lessons` |
| Opportunities | `events`, `event_bookmarks` |
| Community | `discussions`, `discussion_comments`, `discussion_votes`, `discussion_bookmarks`, `communities`, `community_memberships` |
| Messaging | `conversations`, `conversation_participants`, `messages` |
| Administration | `content_reports`, `announcements`, `audit_logs` |

All user-scoped tables use `DEFAULT auth.uid()` on their owner column so
client-side inserts work without manually threading the user ID.

## Migration Instructions

Migrations are applied automatically when the project is connected to
Supabase. To re-apply or inspect them:

1. Open your Supabase dashboard → **SQL Editor**.
2. The three migrations live in `supabase/migrations/`:
   - `001_initial_schema.sql` — 25 tables, RLS policies, indexes, triggers
   - `002_seed_content.sql` — 22 DSA topics, 1 web-dev roadmap with 12 phases,
     starter lessons, 6 sample problems, 2 sample events
   - `003_upvote_rpc.sql` — atomic `increment_upvote` / `decrement_upvote`
     SECURITY DEFINER functions for discussion votes
3. Paste the contents of each file in order and click **Run**.

> In a Bolt project these migrations are applied for you — no manual action is
> needed unless you want to re-seed.

## Authentication Provider Setup

CodeOrbit uses **Supabase Auth** with email/password by default. Email
confirmation is intentionally OFF so new users can sign in immediately.

### Email / Password (default)

No extra setup — works out of the box once the env vars are in place.

### Google OAuth (optional)

1. Supabase dashboard → **Authentication → Providers → Google**.
2. Enable it and paste your Google OAuth client ID and secret
   (created in the Google Cloud Console).
3. Add the Supabase callback URL
   (`https://<your-project>.supabase.co/auth/v1/callback`) to the authorized
   redirect URIs in Google Cloud Console.

### Admin role

After creating your account, promote it to admin in the Supabase dashboard:

**Authentication → Users → click your user → edit `app_metadata`** and set:

```json
{ "role": "admin" }
```

The `is_admin()` SQL function checks `auth.jwt() -> 'app_metadata' ->> 'role'`
and the frontend reads the same value to show admin navigation. This is
enforced at the database level — admin-only tables reject writes from
non-admins regardless of what the client sends.

## Local Development

The dev server starts automatically in Bolt. For a local clone:

```bash
npm run dev    # start the dev server (http://localhost:3000)
npm run build  # production build
npm run lint   # lint
```

The first time you sign up you'll be guided through a 4-step onboarding flow
that collects your basics, education info, coding-profile links, and learning
goals.

## Deployment

### Vercel (recommended)

1. Push your repo to GitHub/GitLab/Bitbucket.
2. Import it into [Vercel](https://vercel.com).
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings.
4. Deploy. Vercel auto-detects Next.js.

### Other platforms

Any Node 18+ host that supports Next.js works (Netlify, Railway, etc.). Make
sure the environment variables are set in the host's dashboard.

## Administrator Account Setup

1. **Sign up** normally at `/signup`.
2. Complete onboarding.
3. In the **Supabase dashboard** → Authentication → Users, find your user.
4. Under **Raw App Metadata**, add `{ "role": "admin" }` and save.
5. Sign out and back in — you'll now see the **Admin** section in the sidebar.

Admins can:
- Create / edit / publish DSA problems, events, roadmaps, phases, lessons
- Suspend or reactivate users
- Publish, archive, or delete announcements
- Resolve or dismiss content reports
- View platform-wide aggregate stats

All admin actions on privileged tables are enforced by RLS via the
`is_admin()` function, so a non-admin cannot modify shared content even by
calling the API directly.

## Project Structure

```
app/                      Next.js App Router pages
  (auth)/                 Auth pages (signin, signup, forgot-password)
  auth/callback/          OAuth / email-link callback handler
  dashboard/              Personal dashboard
  dsa/                    DSA problem explorer + detail
  roadmaps/               Roadmap list + detail
  opportunities/          Contests & hackathons
  community/              Developer directory
  developers/[id]/        Public profile
  discussions/            Discussion list + detail
  messages/               Real-time messaging
  profile/                Profile settings
  admin/                  Admin dashboard + sub-pages
  privacy/                Privacy Policy
  terms/                  Terms of Service
  onboarding/             4-step onboarding flow
components/               Shared UI (AppShell, AdminGuard, Logo, etc.)
lib/                      Client logic
  supabase.ts             Supabase client singleton
  types.ts                TypeScript interfaces
  auth-context.tsx        Auth provider + session state
  queries.ts              Data-fetching helpers
  recommendations.ts     Rules-based recommendation engine
  format.ts               Formatting & color helpers
supabase/
  migrations/             SQL migrations (schema, seed, RPCs)
  config.toml             Supabase project config
```

## Known Limitations

- **No file uploads** — profile avatars use initials rather than image upload.
- **No email sending** — password reset relies on Supabase's built-in email;
  on the free tier this is rate-limited.
- **Single roadmap seeded** — the Web Development roadmap is fully populated;
  additional roadmaps can be created from the admin dashboard.
- **Recommendations are rules-based** — not ML-powered. The engine lives in
  `lib/recommendations.ts` and is designed to be swapped out later.
- **No push notifications** — messaging uses in-app real-time only.

## Planned Future Enhancements

- ML-powered personalized recommendations
- Group / community chat rooms
- Contest integration with live leaderboards
- Code editor with in-browser execution for DSA problems
- Streak tracking and gamification badges
- Mobile app (React Native)
- Profile avatar uploads via Supabase Storage
- Email notification preferences

## License

This project is provided as-is for educational and personal use.
