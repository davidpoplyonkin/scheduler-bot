# Scheduler Bot

A Telegram Mini App for scheduling appointments. Features a React frontend with a FastAPI backend, supporting user bookings, admin management, Google Calendar integration, and multi-language localization.
## Features

- **Appointment Booking** - Users can browse available time slots and book appointments
- **Service Selection** - Multiple appointment types with configurable pricing
- **Payment Processing** - Monobank integration for paid services, with free service support
- **Admin Management** - Admins can view all appointments and create blackout periods
- **QR Verification** - Users generate signed QR codes to prove appointment ownership; admins scan to verify
- **Google Calendar Integration** - New bookings automatically sync to admin's Google Calendar
- **Telegram Notifications** - Admins receive Telegram alerts for new bookings
- **Multi-language Support** - English, Russian, and Ukrainian localization
- **Native Telegram Theme Integration** - Inherits the user's Telegram theme, matching light/dark modes and the primary color
## Tech Stack

| Layer         | Technology                             |
| ------------- | -------------------------------------- |
| Frontend      | React 19, TypeScript, Vite, Mantine UI |
| Backend       | FastAPI, Python, SQLAlchemy 2 (async)  |
| Database      | PostgreSQL 17, Alembic migrations      |
| Caching/Jobs  | Redis 7, APScheduler                   |
| External APIs | Telegram Bot API, Google Calendar API, Monobank API |
| Deployment    | Docker Compose, Nginx                  |
## Project Structure

```

scheduler-bot/

├── tg_mini_app/ # React frontend
│ ├── src/
│ │ ├── routes/ # TanStack Router file-based routes
│ │ ├── components/ # Reusable UI components
│ │ ├── services/ # API client (Axios)
│ │ └── utils/ # Auth, helpers
│ └── public/locales/ # i18n translation files
├── crud_api/ # FastAPI backend
│ ├── app/
│ ├── routers/ # API endpoints (auth, user, admin)
│ ├── models/ # SQLAlchemy models
│ ├── schemas/ # Pydantic schemas
│ ├── utils/ # Auth, Telegram verification
│ └── alembic/ # Database migrations
├── nginx/ # Reverse proxy config
└── docker-compose.yml
```
## Getting Started
### Prerequisites
- Docker and Docker Compose
- [Nested Proxy](https://github.com/davidpoplyonkin/nested-proxy)
- Telegram Bot
  * [Create the bot](https://core.telegram.org/bots/features#creating-a-new-bot), and save the token.
  * Determine the admin Telegram ID
    1. Send an arbitrary message to the bot from the admin Telegram account.
    2. Send a request to `https://api.telegram.org/bot{TG_TOKEN}/getUpdates` and extract the sender's ID.
- Google Calendar
  * Create a project and enable the API
    1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
    2. Log in with the admin Google account.
    3. Click the project dropdown in the top left and select **New Project**. Give it a name and click **Create**.
    4. In the left-hand sidebar, navigate to **APIs & Services** > **Library**.
    5. Search for **"Google Calendar API"**, click on it, and hit the **Enable** button.
  * Create a service account
    1. Go to **APIs & Services** > **Credentials**.
    2. Click **+ Create Credentials** at the top and choose **Service Account**.
    3. Fill out the name, click **Create and Continue**, and hit **Done**.
    4. Click on the newly created service account email from the list, go to the **Keys** tab, click **Add Key** > **Create New Key**, and select **JSON**.
    5. Save the JSON file.
    6. Open the admin Google Calendar, go to settings, and share your calendar with the service account email address, giving it **"Make changes to events"** permission.
### Setup
#### Nginx Configuration

Update `nginx/nginx.conf` to use the actual `server_name`'s
#### Environment Variables

Crete a `.env` file at the project root:

```env
# Security
JWT_SECRET=your_jwt_secret_key
QR_TOKEN=your_qr_signing_secret

# CORS
API_URL=https://your-api-domain.com
API_ALLOW_ORIGINS=https://your-frontend-domain.com

# Bookings
IANA_TZ=America/New_York
MIN_ADVANCE_MINUTES=60
MAX_ADVANCE_DAYS=30
FORBIDDEN_WEEKDAYS=5,6
PENDING_CHECKOUT_TIMEOUT_SECONDS=900
APPOINTMENT_DURATION_MINUTES=60

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=scheduler

# Redis
REDIS_PASSWORD=your_redis_password

# Telegram
TG_TOKEN=your_telegram_bot_token
ADMIN_TG_ID=your_telegram_user_id

# Google Calendar
BOT_NAME=YourBot
ADMIN_GOOGLE_EMAIL=admin@gmail.com

# Monobank (Payment Processing)
MONOBANK_TOKEN=your_monobank_merchant_token
MONOBANK_API_URL=https://api.monobank.ua
MONOBANK_REDIRECT_URL=tg://resolve?domain=username_bot&startapp=
MONOBANK_WEBHOOK_URL=https://your-api-domain.com/webhook/monobank
INVOICE_VALIDITY_SECONDS=600
INVOICE_CHECK_DELAY_SECONDS=60
INVOICE_CHECK_MAX_RETRIES=30
```

#### Google Service Account Key

Rename the JSON file to `google-key.json` and place it at the project root.
#### Start All Services

```bash
docker compose up --build -d
```
#### Database

```shell
docker exec -ti <postgres-container> psql -U <postgres-user> -d <postgres-db>
```

Populate the `time_slots` database table:

```psql
insert into time_slots (start_time) values ('<hh:mm:ss>'), ('<hh:mm:ss>');
```

Populate the `services` table:

```psql
insert into services (amount_minor, currency_code, destination_template) values (1000, 840, 'A $10 service');
```

Populate the `service_translations` table:

```psql
insert into service_translations (service_id, language_code, name) values (1, 'en', 'Some Service');
```
## Architecture
### Authentication Flow
1. Frontend sends Telegram InitData to `POST /auth/token`
2. Backend verifies HMAC signature and expiry, upserts user, returns JWT cookie
3. Subsequent requests include JWT via cookies
4. On 401, frontend interceptor re-authenticates and retries
### Key Models
- **User** - Telegram user with role (determined by `ADMIN_TG_ID`)
- **TimeSlot** - Available booking slots
- **Block** - A date + time slot (either admin blackout or user appointment)
- **Appointment** - User assigned to a block with service selection and payment tracking
- **Service** - Appointment type with translations and pricing (`amount_minor`, `currency_code`)
### Appointment Statuses
- `PENDING` - Reserved, awaiting payment
- `CONFIRMED` - Payment completed, appointment active
- `REDEEMED` - Appointment used
- `CANCELLED` - Cancelled by user or admin

### Payment Flow (Monobank Acquiring)
1. User selects a service and time slot, creates appointment with `status=PENDING`
2. For free services (`amount_minor=0`): skip payment, confirm immediately
3. For paid services: backend creates Monobank invoice, returns `payment_url`
4. User completes payment on Monobank hosted page
5. Backend receives webhook or polls for status → `status=CONFIRMED`
6. On payment failure/expiry: appointment cancelled, block released
## API Endpoints

| Endpoint                | Method | Description                        |
| ----------------------- | ------ | ---------------------------------- |
| `/auth/token`           | POST   | Exchange Telegram InitData for JWT |
| `/user/appointments`    | GET    | List user's appointments           |
| `/user/appointments`    | POST   | Reserve an appointment             |
| `/user/proofs/generate` | POST   | Generate QR proof for appointment  |
| `/admin/appointments`   | GET    | List all appointments              |
| `/admin/blackout`       | POST   | Create blackout period             |
| `/admin/proofs/verify`  | POST   | Verify QR proof                    |
| `/shared/blocks`        | GET    | Get booked/blocked slots           |
| `/shared/constraints`   | GET    | Get booking constraints            |
| `/shared/services`      | GET    | List available services            |
| `/webhook/monobank`     | POST   | Receive payment status updates     |

