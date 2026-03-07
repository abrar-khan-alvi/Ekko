# Ekko-Loop

Ekko-Loop is a modern, responsive full-stack application. It features a robust Python/Django backend with PostgreSQL, and a dynamic React frontend built with Vite and Tailwind CSS. The application includes a comprehensive authentication system with role-based access control (RBAC), personalized user dashboards, and an administrative interface for managing customers.

## Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **Icons:** Lucide React
- **Charts:** Recharts

### Backend
- **Framework:** Django & Django Rest Framework (DRF)
- **Authentication:** JWT (JSON Web Tokens) via `rest_framework_simplejwt`
- **Database:** PostgreSQL (Containerized)
- **Caching:** Django Core Cache (in-memory for OTP)
- **Email:** SMTP (e.g., Gmail) for OTP delivery

### Infrastructure
- **Containerization:** Docker & Docker Compose

## Features
- **Secure Authentication:** JWT-based login, secure credential storage.
- **OTP Verification:** Email-based OTP for account verification during signup.
- **Role-Based Access Control (RBAC):** Distinct views and permissions for Members and Super Admins.
- **Admin Dashboard:** Specific views (`Customers.tsx`, `CustomerDetails.tsx`) allowing admins to view user details, modify business profiles, and manage subscription statuses (`Paid`/`Unpaid`).
- **Profile Management:** Users can update their business details while personal information remains locked/read-only for security.
- **Password Management:** Secure password change functionality.

---

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (Only needed if running the frontend outside of Docker or for local development tools)
- Git

## Environment Variables

### Backend (`.env` or configured in `docker-compose.yml`)
You will need to set up the following environment variables for the backend to function correctly, particularly the email credentials for OTPs.

*   `DEBUG`: `1` for Development, `0` for Production
*   `SECRET_KEY`: Your Django secret key
*   `DB_NAME`: `ekkoloop_db`
*   `DB_USER`: `ekko_user`
*   `DB_PASS`: `ekko_pass`
*   `DB_HOST`: `db` (when using Docker Compose)
*   `DB_PORT`: `5432`
*   `EMAIL_HOST_USER`: Your Gmail address (e.g., `youremail@gmail.com`)
*   `EMAIL_HOST_PASSWORD`: Your 16-character Gmail App Password
*   `DEFAULT_FROM_EMAIL`: Your Gmail address

## Getting Started (Docker Setup)

The easiest way to run the entire application (Database + Backend + Frontend is typically handled separately in dev but can be containerized) is using Docker Compose.

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd Ekko-Loop
```

### 2. Start the Application

Currently, the `docker-compose.yml` is configured to run the PostgreSQL database and the Django backend. The frontend is run separately using Vite's dev server.

Open two terminal windows.

**Terminal 1 (Backend & Database):**
```bash
# This will build the backend image and start both the db and backend containers
docker compose up --build
```
The backend will be available at `http://localhost:8000`.

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173` (or the port specified by Vite).

### 3. Migrations and Database Setup

When running for the first time, you need to apply database migrations.

```bash
docker compose exec backend python manage.py migrate
```

### 4. Create a Superuser (Admin)

To access the admin features of the application (like the Customers directory and subscription toggling), you need a superuser account.

```bash
docker compose exec backend python manage.py createsuperuser
```
Follow the prompts to enter an email and password.

## Moving Data Between Computers

If you are moving the project to a new computer (e.g., from home to the office) and want to keep your data, a database dump has been provided.

**To restore the database on a new machine:**
Make sure the containers are running (`docker compose up -d`), then run:
```bash
docker compose exec backend python manage.py loaddata db_backup.json
```
This will import all users, profiles, and settings from the backup file.

**To create a new backup:**
If you make changes and want to save them before pushing to git:
```bash
docker compose exec backend bash -c "python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission --indent 4 > db_backup.json"
```

## Project Structure

```text
Ekko-Loop/
├── backend/                  # Django Backend
│   ├── authentication/       # App handling users, profiles, and auth
│   ├── core/                 # Main Django settings
│   ├── Dockerfile            # Backend Docker instructions
│   ├── manage.py             # Django entry point
│   ├── requirements.txt      # Python dependencies
│   └── db_backup.json        # Database export
├── frontend/                 # React Frontend
│   ├── public/               # Static assets
│   ├── src/                  # Source code
│   │   ├── components/       # Reusable UI components
│   │   ├── layouts/          # Page layouts (e.g., DashboardLayout)
│   │   ├── pages/            # View components (Auth flows, Dashboard)
│   │   ├── utils/            # Utility functions (e.g., API fetch wrapper)
│   │   ├── App.tsx           # React Router setup
│   │   └── index.css         # Tailwind directives and global styles
│   ├── package.json          # Node.js dependencies
│   ├── tailwind.config.js    # Tailwind configuration
│   ├── tsconfig.json         # TypeScript configuration
│   └── vite.config.ts        # Vite configuration
└── docker-compose.yml        # Multi-container orchestration
```

## License
MIT
