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

### Database Migrations
```bash
# Create new migration (inside crud_api/)
alembic -c app/alembic.ini revision --autogenerate -m "description"
# Migrations auto-apply on Docker container startup
```

## Architecture

### Frontend
- **Routing**: TanStack Router with file-based routes in `src/routes/`
  - `__root.tsx` - App shell with safe area insets
  - `index.tsx` - Auth-based redirect (admin vs user)
  - `user/index.tsx` - Appointment list
  - `user/booking.tsx` - Booking form with date/time/service selection
  - `admin/index.tsx` - Admin appointment list
  - `admin/blackout.tsx` - Blackout form for blocking time slots
- **State**: TanStack Query for server state, Mantine Form for form state
- **API Client**: `src/services/crud.ts` - Axios with 401 interceptor for auto token refresh
- **Auth**: `src/utils/auth.ts` - Exchanges Telegram InitData for JWT
- **Localization**: i18next with `public/locales/[en|ru|uk]/` JSON files

### Backend
- **Routers**: `app/routers/` - auth, user, admin, shared, webhook
- **Models**: `app/models/` - User, TimeSlot, Block, Appointment, Blackout, Service
- **Auth**: `app/deps/auth.py` - RBAC decorator; `app/utils/init_data.py` - InitData verification + JWT
- **Database**: Async SQLAlchemy with AsyncPG, Alembic migrations in `app/migrations/`
- **Integrations**: `app/utils/google_calendar.py`, `app/utils/notifications.py`

### Authentication Flow
1. Frontend sends Telegram InitData to `POST /auth/token`
2. Backend verifies HMAC signature + expiry, upserts user, returns JWT cookie
3. Subsequent requests include JWT via cookies
4. On 401, frontend interceptor re-authenticates and retries

### QR Proof Verification
Users can generate signed QR codes for appointments, which admins scan to verify:
1. User clicks QR icon → `POST /user/proofs/generate` returns HMAC-signed payload
2. Admin uses Telegram's native QR scanner (Secondary Button) → scans QR
3. `POST /admin/proofs/verify` validates signature, expiration, and ownership
4. Signing uses `QR_SECRET_KEY` derived from `QR_TOKEN` env var (separate from `TG_TOKEN`)

**Key files:**
- `app/utils/init_data.py` - `verify_init_data()` with custom exceptions (`InitDataInvalid`, `InitDataExpired`)
- `app/schemas/proof.py` - Request/response schemas for generate and verify
- `src/components/BottomButton.tsx` - Unified Main/Secondary button component

### Payment Flow (Monobank Acquiring)
Appointment booking integrates with Monobank to create payment invoices:
1. `POST /user/appointments` creates Block + Appointment with `status=PENDING`, `invoice_id=NULL`
2. Backend calls Monobank `POST /api/merchant/invoice/create` with service pricing
3. On success: appointment updated with `invoice_id`, response includes `payment_url`
4. On failure: Block deleted, appointment `status=CANCELLED`
5. User redirected to `payment_url` (Monobank hosted payment page)
6. Backend schedules invoice status polling via APScheduler

**Invoice Status Polling:**
- `schedule_invoice_check()` schedules a job to poll Monobank `GET /api/merchant/invoice/status`
- Polls every `INVOICE_CHECK_DELAY_SECONDS` (default: 60s), up to `INVOICE_CHECK_MAX_RETRIES` (default: 30)
- On `success`: appointment `status=CONFIRMED`, calendar event created, admin notified
- On `failure`/`expired`/`reversed`: Block deleted, appointment `status=CANCELLED`
- On `created`/`processing`: reschedule check (countdown `retries_left`)

**Webhook Endpoint:**
- `POST /webhook/monobank` receives payment status updates from Monobank
- ECDSA signature verification via `MonobankWebhookPayload` dependency (public key cached, refreshed on failure)
- On terminal status (`success`/`failure`/`reversed`): cancels polling job via `cancel_invoice_check()`
- Handles status same as polling: `on_payment_success()` or `cancel_appointment_invoice()`
- Note: Monobank does NOT send webhook for `expired` status, so polling remains the fallback

**Key files:**
- `app/utils/monobank.py` - `create_invoice()`, `get_invoice_status()`
- `app/utils/invoice_checker.py` - `schedule_invoice_check()`, `check_invoice_status()`, `cancel_invoice_check()`, `on_payment_success()`
- `app/schemas/monobank.py` - `InvoiceStatus` enum, `InvoiceCreateRequest`, `InvoiceCreateResponse`, `InvoiceStatusResponse`
- `app/crud/appointment.py` - `confirm_appointment_invoice()`, `cancel_appointment_invoice()`, `confirm_appointment_payment()`
- `app/routers/webhook.py` - `POST /webhook/monobank` endpoint
- `app/deps/monobank.py` - `MonobankWebhookPayload` dependency with ECDSA signature verification

### Key Schema
- `Block` = date + time slot (either admin blackout or user appointment)
- `Appointment` = user assigned to a block, with service selection and `invoice_id`
- `Service` = appointment type with translations (ServiceTranslation) and pricing (`amount_minor`, `currency_code`)
- Role determined by `tg_id == ADMIN_TG_ID` env var

## Environment Variables

Required in `.env`:
- `TG_TOKEN` - Telegram bot token (for InitData verification)
- `QR_TOKEN` - Secret for signing QR proof payloads
- `JWT_SECRET` - JWT signing key
- `ADMIN_TG_ID` - Telegram user ID for admin role
- `IANA_TZ` - Timezone for date handling
- `API_URL` / `API_ALLOW_ORIGINS` - CORS configuration
- PostgreSQL credentials: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `MIN_ADVANCE_MINUTES` - Minimum minutes before a slot can be booked
- `MAX_ADVANCE_DAYS` - Maximum days in advance a slot can be booked
- `FORBIDDEN_WEEKDAYS` - Comma-separated weekday numbers to block (default: `5,6` for Sat/Sun)
- `ADMIN_GOOGLE_EMAIL` - Admin's email for Google Calendar events
- `MONOBANK_TOKEN` - Monobank merchant API token
- `MONOBANK_API_URL` - Monobank API base URL (default: `https://api.monobank.ua`)
- `MONOBANK_REDIRECT_URL` - URL to redirect user after payment
- `MONOBANK_WEBHOOK_URL` - Webhook URL for payment status updates (e.g., `https://your-domain.com/webhook/monobank`)
- `INVOICE_CHECK_DELAY_SECONDS` - Delay between invoice status checks (default: `60`)
- `INVOICE_CHECK_MAX_RETRIES` - Max polling attempts before giving up (default: `30`)
