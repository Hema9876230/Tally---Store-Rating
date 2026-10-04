# Tally — Store Ratings Platform

Tally is a full-stack web application where users rate stores from **1 to 5**. A single login serves three roles, and each role sees different features after signing in.

| Layer    | Technology |
|----------|------------|
| Backend  | Node.js, Express |
| Database | PostgreSQL (plain parameterised SQL via `pg`, no ORM) |
| Frontend | React 18, React Router 6, Vite |
| Auth     | JWT (Bearer token), bcrypt password hashing |

---

## Table of contents

1. [Features](#features)
2. [Project structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Setup](#setup)
5. [Environment variables](#environment-variables)
6. [Demo accounts](#demo-accounts)
7. [Using the app](#using-the-app)
8. [Validation rules](#validation-rules)
9. [Database schema](#database-schema)
10. [API reference](#api-reference)
11. [Security notes](#security-notes)
12. [Production build](#production-build)
13. [Troubleshooting](#troubleshooting)

---

## Features

### System Administrator
- Dashboard with the total number of **users**, **stores** and **submitted ratings**, plus a chart of how ratings are distributed (1–5).
- **Add users** of any role (admin, normal user, store owner) with name, email, password and address.
- **Add stores** (name, email, address, optional owner) and **edit** them.
- View a list of **stores** (name, email, address, rating) and a list of **users** (name, email, address, role).
- **Filter** every list by name, email, address and role (users only).
- Open a user's **details**. For store owners, the store rating is shown too.
- **Sort** any column ascending or descending.

### Normal User
- **Sign up** through the registration page, then log in.
- Browse all registered stores and **search by name or address**.
- Each store shows its name, address, **overall rating**, **your rating**, and stars to submit or change your rating.
- Submit a rating from **1 to 5** for any store. Submitting again modifies it, so there is one rating per user per store.
- Edit their profile and update their password.

### Store Owner
- Log in and see a dashboard with the **average rating** of their store(s) and the **list of users who rated** them.
- Edit their profile and update their password.

### Everyone
- One login page for all roles, with role-based redirects after sign-in.
- **Account** page: edit name, email and address, and change password.
- Sign out.

---

## Project structure

```
tally-store-ratings/
├── database/
│   └── schema.sql              # Tables, constraints, indexes (idempotent)
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js           # Entry point (loads .env, starts the server)
│       ├── app.js              # Express app: security middleware + routes
│       ├── db.js               # PostgreSQL connection pool
│       ├── seed.js             # Creates schema, admin account, demo data
│       ├── middleware/
│       │   ├── auth.js         # JWT verification + role guard
│       │   ├── validate.js     # Request validation rules
│       │   ├── error.js        # Central error handler
│       │   └── wrap.js         # Async error forwarding
│       └── routes/
│           ├── auth.js         # Sign-up, login, profile, password
│           ├── admin.js        # Stats, users, stores (admin only)
│           ├── stores.js       # Store list + ratings (normal user)
│           └── owner.js        # Owner dashboard
└── frontend/
    ├── package.json
    ├── vite.config.js          # Dev server + /api proxy
    ├── index.html
    └── src/
        ├── main.jsx, App.jsx   # Bootstrap + route guards
        ├── api.js              # fetch wrapper + session storage
        ├── auth.jsx            # Auth context (login, signup, profile, logout)
        ├── hooks.js            # useListing (server sort/filter), useLocalSort
        ├── validate.js         # Client-side validation (mirrors the server)
        ├── styles.css          # Design tokens and all styles
        ├── components/         # Layout, AuthShell, DataTable, Stars, ui (Form, Modal…)
        └── pages/              # Login, Signup, Account, Admin*, UserStores, OwnerDashboard
```

---

## Prerequisites

- **Node.js 18 or newer** (the backend uses `Object.hasOwn`)
- **PostgreSQL 13 or newer**
- npm (bundled with Node.js)

---

## Setup

### 1. Create the database

```bash
createdb tally
```

(or in `psql`: `CREATE DATABASE tally;`)

### 2. Start the API

```bash
cd backend
cp .env.example .env      # then edit DATABASE_URL and JWT_SECRET
npm install
npm run seed              # creates tables, the admin account and demo data
npm run dev               # API on http://localhost:5000
```

Generate a strong secret for `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Start the web app

In a second terminal:

```bash
cd frontend
npm install
npm run dev               # App on http://localhost:5173
```

Open **http://localhost:5173**. The dev server proxies `/api` requests to `http://localhost:5000`, so no extra frontend configuration is needed.

### Scripts

| Location   | Command           | What it does |
|------------|-------------------|--------------|
| `backend`  | `npm run dev`     | Start the API with auto-restart on file changes |
| `backend`  | `npm start`       | Start the API (production) |
| `backend`  | `npm run seed`    | Create/upgrade tables, the admin and optional demo data. Safe to re-run |
| `frontend` | `npm run dev`     | Start the Vite dev server |
| `frontend` | `npm run build`   | Build the production bundle into `dist/` |
| `frontend` | `npm run preview` | Preview the production build locally |

---

## Environment variables

Set these in `backend/.env`.

| Variable         | Required | Default                 | Description |
|------------------|----------|-------------------------|-------------|
| `DATABASE_URL`   | Yes      | –                       | PostgreSQL connection string, e.g. `postgres://user:pass@localhost:5432/tally` |
| `JWT_SECRET`     | Yes      | –                       | Secret used to sign tokens. The server refuses to start without it |
| `PORT`           | No       | `5000`                  | API port |
| `JWT_EXPIRES_IN` | No       | `8h`                    | Token lifetime (e.g. `30m`, `8h`, `7d`) |
| `CLIENT_URL`     | No       | `http://localhost:5173` | Origin allowed by CORS |
| `ADMIN_EMAIL`    | No       | `admin@tally.test`      | Admin email created by `npm run seed` |
| `ADMIN_PASSWORD` | No       | `Admin@12345`           | Admin password created by `npm run seed` |
| `SEED_DEMO`      | No       | `true`                  | Set to `false` to create only the admin account, with no demo data |

---

## Demo accounts

Created by `npm run seed` (unless `SEED_DEMO=false`):

| Role        | Email               | Password      |
|-------------|---------------------|---------------|
| Admin       | `admin@tally.test`  | `Admin@12345` |
| Store owner | `owner@tally.test`  | `Demo@1234`   |
| Normal user | `ananya@tally.test` | `Demo@1234`   |
| Normal user | `rohan@tally.test`  | `Demo@1234`   |
| Normal user | `meera@tally.test`  | `Demo@1234`   |

The demo owner is linked to *Maple and Rye Bakery* and *Northside Hardware and Tools*. Change the admin password after first sign-in, and delete the demo accounts before any real deployment.

---

## Using the app

### Add a store (administrator)
1. Sign in as the admin.
2. Open **Stores** in the sidebar and click **Add store**.
3. Fill in the store name, store email (must be unique), address, and optionally a store owner.
4. Click **Add store**. It appears in the list immediately.

The **Store owner** dropdown lists only users with the *Store owner* role. Create one first under **Users → Add user**. To change a store later, click its row to edit it.

### Add a user (administrator)
**Users → Add user**, then fill in name, email, address, a temporary password and the role.

### Rate a store (normal user)
Open **Stores**, find a store with the search box, and click a star from 1 to 5. Click a different star at any time to change your rating.

### Edit your profile or password (all roles)
Open **Account** in the sidebar. The page has a **Profile** section (name, email, address) and a **Password** section.

---

## Validation rules

Rules are enforced on both the client (instant feedback) and the server (authoritative).

| Field          | Rule |
|----------------|------|
| Name (users)   | Required, up to 60 characters |
| Store name     | 1–100 characters |
| Address        | Required, up to 400 characters |
| Password       | 8–16 characters, at least one uppercase letter and one special character |
| Email          | Standard email format, unique per table |
| Rating         | Whole number from 1 to 5 |

Validation failures return HTTP `400` with `{ "message": "...", "errors": { "field": "reason" } }`, and the forms show each error under its field.

---

## Database schema

Defined in `database/schema.sql` (idempotent, so it is safe to run repeatedly).

**users**

| Column          | Type          | Notes |
|-----------------|---------------|-------|
| `id`            | SERIAL PK     | |
| `name`          | VARCHAR(60)   | `CHECK` length 1–60 |
| `email`         | VARCHAR(255)  | UNIQUE, stored lowercase |
| `password_hash` | TEXT          | bcrypt |
| `address`       | VARCHAR(400)  | |
| `role`          | VARCHAR(10)   | `CHECK` in (`admin`, `user`, `owner`), default `user` |
| `created_at`    | TIMESTAMPTZ   | default `now()` |

**stores**

| Column       | Type         | Notes |
|--------------|--------------|-------|
| `id`         | SERIAL PK    | |
| `name`       | VARCHAR(100) | |
| `email`      | VARCHAR(255) | UNIQUE |
| `address`    | VARCHAR(400) | |
| `owner_id`   | INTEGER FK   | → `users.id`, `ON DELETE SET NULL`, indexed |
| `created_at` | TIMESTAMPTZ  | |

**ratings**

| Column       | Type        | Notes |
|--------------|-------------|-------|
| `id`         | SERIAL PK   | |
| `user_id`    | INTEGER FK  | → `users.id`, `ON DELETE CASCADE` |
| `store_id`   | INTEGER FK  | → `stores.id`, `ON DELETE CASCADE`, indexed |
| `rating`     | SMALLINT    | `CHECK` between 1 and 5 |
| `created_at` / `updated_at` | TIMESTAMPTZ | |
| —            | `UNIQUE (user_id, store_id)` | one editable rating per user per store |

Average ratings are computed with aggregate queries rather than stored, so they never go stale.

---

## API reference

Base URL: `http://localhost:5000/api`. Protected routes need the header `Authorization: Bearer <token>`.

### Auth

| Method | Path | Access | Body / notes |
|--------|------|--------|--------------|
| POST | `/auth/signup` | Public | `{ name, email, address, password }`. Always creates a **normal user** |
| POST | `/auth/login` | Public | `{ email, password }`. Rate limited |
| GET  | `/auth/me` | Signed in | Returns `id, name, email, address, role` |
| PUT  | `/auth/profile` | Signed in | `{ name, email, address }`. Returns a fresh token and user |
| PUT  | `/auth/password` | Signed in | `{ currentPassword, newPassword }` |

Sign-up and login respond with:

```json
{ "token": "<jwt>", "user": { "id": 1, "name": "…", "email": "…", "role": "user" } }
```

### Admin (role `admin`)

| Method | Path | Notes |
|--------|------|-------|
| GET  | `/admin/stats` | `{ users, stores, ratings, distribution: { "1": n, … "5": n } }` |
| GET  | `/admin/users` | Query: `name`, `email`, `address`, `role`, `sort` (`name`, `email`, `address`, `role`, `rating`), `order` (`asc`/`desc`) |
| GET  | `/admin/users/:id` | User details; `rating` is set for store owners |
| POST | `/admin/users` | `{ name, email, address, password, role }` |
| GET  | `/admin/stores` | Query: `name`, `email`, `address`, `sort` (`name`, `email`, `address`, `rating`), `order` |
| POST | `/admin/stores` | `{ name, email, address, ownerId? }` |
| PUT  | `/admin/stores/:id` | Same body as POST |

### Normal user (role `user`)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/stores` | Query: `q` (matches name or address), `sort` (`name`, `address`, `rating`, `my_rating`), `order`. Each row has `rating`, `rating_count`, `my_rating` |
| PUT | `/stores/:id/rating` | `{ "rating": 1-5 }`. Creates or updates your rating and returns the new average |

### Store owner (role `owner`)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/owner/dashboard` | `{ stores, raters, overall }`: per-store averages, users who rated, and overall average and count |

### Status codes

`200`/`201` success · `400` validation failed · `401` not signed in or token expired · `403` wrong role · `404` not found · `409` duplicate email · `429` too many login attempts · `500` unexpected error

---

## Security notes

- **Passwords** are hashed with bcrypt (cost 12). Plain-text passwords are never stored or returned.
- **JWT authentication** runs on every protected route, with **role guards** applied per route group. The frontend guards are for usability only, and the server is what enforces access.
- **SQL injection:** all values are bound parameters, and sortable columns come from fixed allow-lists.
- **Hardening:** `helmet` headers, CORS limited to `CLIENT_URL`, a 10 KB JSON body limit, and rate limiting on the login route (50 attempts per 15 minutes per IP).
- **Public sign-up** can only create normal users. Admin and owner accounts are created by an administrator.
- **Token storage:** the JWT is kept in `localStorage` for simplicity. For a hardened production deployment, move it to an `httpOnly`, `Secure`, `SameSite` cookie and add CSRF protection.
- Never commit `.env`. It is already in `.gitignore`.

---

## Production build

The frontend calls the API at the relative path `/api`, so serve both from one origin behind a reverse proxy.

```bash
# Frontend
cd frontend && npm run build        # outputs frontend/dist

# Backend
cd backend && NODE_ENV=production npm start
```

Example Nginx layout:

```nginx
server {
  listen 80;
  root /var/www/tally/dist;
  location /api/ { proxy_pass http://127.0.0.1:5000; }
  location /     { try_files $uri /index.html; }   # SPA fallback
}
```

Set `CLIENT_URL` to your public site URL, use a long random `JWT_SECRET`, serve over HTTPS, and run the API under a process manager such as PM2 or systemd.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `JWT_SECRET is required` on start | Copy `.env.example` to `.env` and set `JWT_SECRET` |
| `ECONNREFUSED` or `password authentication failed` | Check that PostgreSQL is running and `DATABASE_URL` has the right user, password, host and database |
| `relation "users" does not exist` | Run `npm run seed` in `backend` to create the tables |
| Name rejected with a "20–60 characters" error, or a database `users_name_check` error | You have an old copy of the database or code. Update the project, then re-run `npm run seed`. It relaxes the old constraint |
| "That email is already in use" | Emails are unique for users and for stores. Use a different one |
| Frontend shows network errors | Make sure the API is running on port 5000, or update the proxy in `frontend/vite.config.js` |
| Redirected to the login page unexpectedly | The token expired (default 8 hours). Sign in again |
| Store owner dashboard says no store is linked | An admin must assign the owner to a store under **Stores → (click store) → Store owner** |

---

## Ideas for next steps

Admin editing and deleting of users, deleting stores, pagination for large lists, password reset by email, automated tests (API and UI), and a Docker Compose setup.
