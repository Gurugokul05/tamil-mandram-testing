# Tamil Mandram — தமிழ் மன்றம்

A full-stack bilingual (தமிழ் / English) website for a university Tamil literary and cultural club. Deep maroon and gold, kolam motifs, and a motion system built around Framer Motion, GSAP and Lenis.

**Tagline:** மொழியால் இணைவோம் — *United by language, rooted in culture.*

---

## What is included

**Public site**

- Home: animated hero, membership status banner with announcement ticker, live stats, achievements, flagship-event horizontal scroll, FAQ accordion, helpdesk contacts
- Wings: six role cards that flip to show expectations and gains
- Events: upcoming/past filters, event detail pages with schedule, rules, eligibility and registration
- Team: faculty, office bearers, student coordinators and wing leads
- Achievements & gallery: year-filtered achievements plus a masonry gallery with lightbox
- Contact: validated form with animated labels and a draw-on success state
- Membership landing page with the four-step approval flow

**Accounts and membership**

- Sign up → submit profile (register number, department, year, wing, phone, photo) → `pending_president` → president review → `pending_faculty` → faculty approval → approved
- Applicants track progress on an animated status stepper
- Suspended members lose member-area access immediately; removed members cannot sign in at all
- JWT auth, bcrypt hashing, role guards on both API and React routes

**Member dashboard**

- Announcements, my registrations with QR passes, member directory, resources, notifications, profile editing

**Admin panel (president + faculty)**

- Approval queue with approve/reject + required reasons
- Member management: search, filters, role changes, suspend, reinstate, remove
- Events CRUD, registration lists, CSV export, QR attendance scanning
- CRUD for wings, achievements, team, FAQ, announcements, resources
- Site settings: identity, contact details, coordinators, social links, membership intake toggle
- Audit log for every approval, rejection, removal, role change and content edit

---

## Stack

| Layer      | Choice |
| ---------- | ------ |
| Frontend   | React 18, Vite, Tailwind CSS, Framer Motion, GSAP ScrollTrigger, Lenis |
| Backend    | Node.js, Express, JWT |
| Database   | MongoDB Atlas (Mongoose) |
| Uploads    | Cloudinary (local `server/uploads/` fallback when unconfigured) |
| Email      | Nodemailer (console fallback when SMTP is unconfigured) |
| Validation | Zod + Mongoose schemas |

---

## Repository layout

```
.
├── client/
│   ├── public/                 favicon
│   └── src/
│       ├── components/
│       │   ├── auth/           AuthShell, route guards
│       │   ├── dashboard/      dashboard shell, QR pass modal
│       │   ├── home/           hero, status banner, achievements, events, FAQ, helpdesk
│       │   ├── layout/         navbar, footer, cursor, preloader, smooth scroll
│       │   ├── motion/         Reveal, Stagger, CountUp, TiltCard, ScrambleText
│       │   └── ui/             buttons, forms, accordion, stepper, kolam, skeletons
│       ├── context/            language, site, auth, toasts, nav theme
│       ├── hooks/
│       ├── lib/                API client, formatting helpers
│       └── pages/              public, auth, member dashboard, admin panel
├── server/
│   ├── public/media/           generated seed artwork (SVG)
│   └── src/
│       ├── config/             env + database
│       ├── controllers/        public, auth, profile, member, registration, admin, content
│       ├── middleware/         auth, validation, rate limits, uploads, errors
│       ├── models/             Mongoose schemas
│       ├── routes/
│       ├── seed/               bilingual sample data + artwork generator
│       └── utils/
└── package.json                npm workspaces
```

---

## Setup

### 1. Requirements

- Node.js 20+
- A MongoDB Atlas cluster

### 2. Install

```bash
npm install
```

### 3. Environment

```bash
cp server/.env.example server/.env
```

In MongoDB Atlas:

1. Create a cluster and a database user.
2. Allow your IP address (or `0.0.0.0/0` while developing).
3. Copy the driver connection string into `MONGODB_URI`, including a database name before the query string:

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/tamil-mandram?retryWrites=true&w=majority
```

Set a long random `JWT_SECRET`. Cloudinary and SMTP values are optional — without them images go to `server/uploads/` and emails are logged to the console.

### 4. Seed sample content

```bash
npm run seed
```

This clears the app's collections in the configured database, then inserts wings, events, achievements, team members, FAQs, announcements, resources, users, registrations, notifications and audit entries. It also writes 12 poster/achievement SVGs into `server/public/media/`.

### 5. Run

```bash
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:5000 (health: `/api/health`)

The Vite dev server proxies `/api`, `/media` and `/uploads` to the API.

### Seeded accounts

All sample accounts use the password `Mandram@2026`.

| Email | Role | Status |
| ----- | ---- | ------ |
| `faculty@mandram.test` | faculty_coordinator | approved |
| `president@mandram.test` | president | approved |
| `coordinator@mandram.test` | student_coordinator | approved |
| `member@mandram.test` | member | approved |
| `ananya@mandram.test` | member | pending president |
| `sneha@mandram.test` | member | pending faculty |

Change or delete these before deploying publicly.

---

## Approval flow

```
sign up → profile → pending_president → pending_faculty → approved
                         │                    │
                         └── rejected ◄───────┘
suspended ⇄ approved          removed → no access
```

- Only the president can decide at the president stage; only the faculty coordinator at the faculty stage.
- Rejections require a reason (5+ characters) and are shown to the applicant.
- Every decision writes an audit entry and sends a notification (plus email when SMTP is configured).
- Suspension and removal bump the user's `tokenVersion`, invalidating existing JWTs immediately. Removal also blocks future logins.
- Applications are refused at the profile step when the admin has closed the yearly intake.

---

## API overview

All responses are `{ success, data }` or `{ success: false, message, details? }`.

### Public

| Method | Route | Notes |
| ------ | ----- | ----- |
| GET | `/api/public/site` | club identity, contacts, membership status, live stats |
| GET | `/api/public/wings` | active wings |
| GET | `/api/public/events` | `?filter=upcoming\|past\|all&category=&limit=` |
| GET | `/api/public/events/:slug` | member-only notes only for approved members |
| GET | `/api/public/achievements` | `?year=` |
| GET | `/api/public/gallery` | achievements + event posters |
| GET | `/api/public/team` | team members |
| GET | `/api/public/faqs` | active FAQs |
| GET | `/api/public/announcements` | public announcements |
| POST | `/api/public/contact` | validated, 8 messages/hour/IP |

### Auth and profile

`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `PATCH /api/auth/password`, `GET|PUT /api/auth/profile`

### Member (approved only)

`GET /api/member/overview`, `/announcements`, `/directory`, `/resources`, `/registrations`, `/notifications`
`POST /api/member/events/:slug/register`
`DELETE /api/member/registrations/:id`
`GET /api/member/registrations/:id/pass` (QR data URL)
`PATCH /api/member/notifications/:id/read`, `POST /api/member/notifications/read-all`

### Admin (president / faculty)

- Approvals: `GET /api/admin/applications`, `POST /api/admin/applications/:id/president|faculty`
- Members: `GET /api/admin/members`, `PATCH /:id/role`, `POST /:id/suspend`, `POST /:id/reinstate`, `DELETE /:id`
- Content: `GET|POST /api/admin/content/:entity`, `PATCH|DELETE /api/admin/content/:entity/:id` (`wings`, `events`, `achievements`, `team`, `faqs`, `announcements`, `resources`)
- Events: `GET /api/admin/events/:id/registrations` (`?format=csv`), `POST /api/admin/scan`
- Settings: `GET|PATCH /api/admin/settings`, `POST /api/admin/settings/membership-toggle`
- Audit: `GET /api/admin/audit-logs`
- Uploads: `POST /api/uploads/image` (5 MB limit, JPEG/PNG/WebP/AVIF)

---

## Data model

- **User** — role, approval state, profile, wing, photo, review decisions, token version
- **Wing** — bilingual name/tagline/description, expectations, gains, icon, ordering
- **Event** — bilingual content, poster, category, dates, venue, eligibility, rules, schedule, member-only notes, registration window, capacity
- **Registration** — user × event, status, unique QR pass code, check-in audit
- **Achievement**, **TeamMember**, **Faq**, **Announcement**, **Resource**, **SiteSetting**, **Notification**, **AuditLog**, **ContactMessage**

Bilingual values are stored as `{ ta, en }` objects so any field can be edited in both languages.

---

## Motion and performance

- Lenis smooth scroll, disabled under `prefers-reduced-motion`
- Framer Motion page transitions, staggered reveals and layout animations
- GSAP ScrollTrigger pinned horizontal event carousel on desktop; native snap scrolling on mobile
- Word-by-word masked hero reveal, count-up stats, text scramble, 3D tilt cards, cursor-following glow
- SVG stroke-drawn preloader with curtain reveal (once per session)
- Scroll progress bar, scroll-direction-aware glass navbar, custom cursor with trailing ring
- Route-level code splitting, lazy images, animation primitives in `client/src/components/motion`
- Animations are limited to `transform` and `opacity`; heavy effects are skipped for reduced-motion users

---

## Security

- Passwords hashed with bcrypt (cost 12), never serialised
- Zod validation on every write route; central error handler for Zod/Mongo/Multer/JWT errors
- JWT with issuer check and token versioning for instant revocation
- Route guards on both API and client (`RequireAuth`, `RequireApproved`, admin role checks)
- Helmet, CORS allow-list (including localhost development origins), Mongo operator sanitising, 1 MB JSON limit
- Rate limits: 400 requests / 15 min per IP, 20 auth attempts / 15 min, 8 contact messages / hour
- Audit log with actor, action, target, reason, IP and metadata
- Upload type/size validation; Cloudinary transformations when configured

---

## React frontend

The Vite React frontend is in `client/`. It uses the existing JWT/Bearer API and connects to `/api` in development through the Vite proxy.

```bash
cp client/.env.example client/.env
npm run dev:client
```

Set `VITE_API_BASE_URL=http://localhost:5000/api` when running the API on port 5000. The existing root command `npm run dev` starts both the API and frontend.

Frontend/API mismatches and missing endpoints:

- The backend has no dedicated literature submissions or public article-reading endpoints. Literature cards and the reading view currently use presentation data rather than API data.
- The backend has no public “timeline” or club-story endpoint; the About timeline is editorial fallback content.
- The backend has no literature/short-story model or submission approval workflow.
- The backend has no separate logout-all session UI beyond the existing `/api/auth/logout` flow.

---

## Scripts

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | API + client together |
| `npm run dev:server` | API with file watching |
| `npm run dev:client` | Vite dev server |
| `npm run seed` | Reset and seed sample data |
| `npm run build` | Production client build |
| `npm start` | Start the API |

---

## Deployment notes

1. Build the client with `npm run build` and serve `client/dist` from a static host or CDN.
2. Deploy `server/` to a Node host, set `NODE_ENV=production`, a strong `JWT_SECRET`, Atlas URI, `CLIENT_ORIGIN=https://your-domain`, and Cloudinary/SMTP credentials.
3. Ensure Atlas network access allows your server (or use VPC peering / PrivateLink).
4. Serve the SPA with a fallback to `index.html` for client-side routes.
5. Change the seeded passwords or delete the sample accounts before going live.

### Troubleshooting

- **CORS errors in development** — the API allows `localhost` and `127.0.0.1` origins automatically. If you use another host, add it to `CLIENT_ORIGIN`.
- **Atlas rejects writes about collection limits** — free M0 clusters cap the whole cluster at 500 collections. Check other databases on the cluster.
- **Images not persisting** — configure Cloudinary; otherwise uploads live in `server/uploads/` and vanish when the host's filesystem is ephemeral.
- **Emails not arriving** — set SMTP values; without them notifications are written to the API console.
