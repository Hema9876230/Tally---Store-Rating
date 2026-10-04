# Tally — Store Ratings Platform

Full-stack app where users rate registered stores from 1 to 5. One login serves three roles:
**System Administrator**, **Normal User** and **Store Owner**.

**Stack:** Express · PostgreSQL · React (Vite). No ORM: queries are parameterised SQL.

## Quick start

Requires Node 18+ and PostgreSQL.

```bash
createdb tally

# API
cd backend
cp .env.example .env        # set DATABASE_URL and a long random JWT_SECRET
npm install
npm run seed                # creates tables, the admin account and demo data
npm run dev                 # http://localhost:5000

# Web (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :5000)
```

## Demo accounts (from `npm run seed`)

| Role         | Email                | Password      |
|--------------|----------------------|---------------|
| Admin        | admin@tally.test     | Admin@12345   |
| Store owner  | owner@tally.test     | Demo@1234     |
| Normal user  | ananya@tally.test    | Demo@1234     |

Set `SEED_DEMO=false` to create only the admin. Change `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.

## Features by role

- **Admin:** dashboard (total users, stores, ratings + distribution); add users (any role) and stores (optionally assigned to an owner); list users and stores with filters on name, email, address and role; user detail view (owners show their store rating); sortable tables.
- **Normal user:** public sign-up; search stores by name or address; see overall rating and own rating; submit or change a rating (1–5); update password.
- **Store owner:** see customers who rated their store(s) and the average rating; update password.
- Everyone can sign out.

## Validation (client and server)

| Field    | Rule |
|----------|------|
| Name     | required, up to 60 characters |
| Address  | up to 400 characters |
| Password | 8–16 characters, at least one uppercase letter and one special character |
| Email    | standard email format |

Store names accept 1–100 characters.

## API

| Method | Path | Access |
|--------|------|--------|
| POST | `/api/auth/signup`, `/api/auth/login` | public |
| GET | `/api/auth/me` | any signed-in user |
| PUT | `/api/auth/profile` `{ name, email, address }` | any signed-in user |
| PUT | `/api/auth/password` | any signed-in user |
| GET | `/api/admin/stats` | admin |
| GET, POST | `/api/admin/users` (`?name&email&address&role&sort&order`) | admin |
| GET | `/api/admin/users/:id` | admin |
| GET, POST | `/api/admin/stores` (`?name&email&address&sort&order`) | admin |
| PUT | `/api/admin/stores/:id` | admin |
| GET | `/api/stores` (`?q&sort&order`) | normal user |
| PUT | `/api/stores/:id/rating` `{ "rating": 1-5 }` | normal user |
| GET | `/api/owner/dashboard` | store owner |

## Design and security notes

- **Schema:** `users`, `stores`, `ratings` with foreign keys, `CHECK` constraints (rating 1–5, name length, role) and `UNIQUE (user_id, store_id)` so each user has exactly one editable rating per store. Average ratings are computed with aggregates, so they cannot go stale.
- Passwords are hashed with bcrypt (cost 12). JWTs are checked on every request and role guards sit on every route group.
- Sort columns are whitelisted and filters are bound parameters, so there is no SQL injection surface.
- Helmet, CORS limited to `CLIENT_URL`, request size limit and login rate limiting are enabled.
- The JWT lives in `localStorage` for simplicity. For a hardened production deployment, move it to an httpOnly cookie.
- Public sign-up can only create normal users. Admin and owner accounts are created by an administrator.

## Structure

```
database/schema.sql
backend/src/{app,server,db,seed}.js · middleware/ · routes/
frontend/src/{App,auth,api,hooks,validate}.* · components/ · pages/
```
