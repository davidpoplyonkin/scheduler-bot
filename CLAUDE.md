# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Telegram Mini App for scheduling appointments. Monorepo with React frontend (`tg_mini_app/`) and FastAPI backend (`crud_api/`).

## Commands

### Frontend (`tg_mini_app/`)
```bash
npm run dev      # Start Vite dev server
npm run build    # TypeScript + Vite production build
npm run lint     # ESLint
```

### Backend (`crud_api/`)
```bash
# Run via Docker - migrations auto-run on startup
docker compose up crud-api postgres
```

### Full Stack
```bash
docker compose up    # All services (requires master-nginx-network)
```

## Architecture

### Frontend
- **Routing**: TanStack Router with file-based routes in `src/routes/`
  - `__root.tsx` - App shell with safe area insets
  - `index.tsx` - Auth-based redirect (admin vs user)
  - `user/index.tsx` - Appointment list
  - `user/booking.tsx` - Booking form with date/time selection
  - `admin/index.tsx` - Admin appointment list
  - `admin/blackout.tsx` - Blackout form for blocking time slots
- **State**: TanStack Query for server state, Mantine Form for form state
- **API Client**: `src/services/crud.ts` - Axios with 401 interceptor for auto token refresh
- **Auth**: `src/utils/auth.ts` - Exchanges Telegram InitData for JWT

### Backend
- **Routers**: `app/routers/` - auth (token exchange), user (appointments/constraints)
- **Models**: `app/models.py` - User, TimeSlot, Block, Appointment
- **Auth**: `app/utils/auth.py` - Telegram InitData verification, JWT handling, RBAC decorator
- **Database**: Async SQLAlchemy with AsyncPG, Alembic migrations in `app/alembic/`

### Authentication Flow
1. Frontend sends Telegram InitData to `POST /auth/token`
2. Backend verifies HMAC signature + expiry, upserts user, returns JWT cookie
3. Subsequent requests include JWT via cookies
4. On 401, frontend interceptor re-authenticates and retries

### Key Schema
- `Block` = date + time slot (either admin blackout or user appointment)
- `Appointment` = user assigned to a block
- Role determined by `tg_id == ADMIN_TG_ID` env var

## Environment Variables

Required in `.env`:
- `TG_TOKEN` - Telegram bot token (for InitData verification)
- `JWT_SECRET` - JWT signing key
- `ADMIN_TG_ID` - Telegram user ID for admin role
- `IANA_TZ` - Timezone for date handling
- `API_URL` / `API_ALLOW_ORIGINS` - CORS configuration
- PostgreSQL credentials: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `MIN_ADVANCE_MINUTES` - Minimum minutes before a slot can be booked
- `MAX_ADVANCE_DAYS` - Maximum days in advance a slot can be booked
- `FORBIDDEN_WEEKDAYS` - Comma-separated weekday numbers to block (default: `5,6` for Sat/Sun)
