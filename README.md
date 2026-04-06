# Ekko: Business Automation & CRM Platform

Ekko is a high-performance, B2B SaaS platform designed to automate customer interactions and streamline operations for service-oriented businesses. By leveraging **n8n** workflows and integrated messaging (WhatsApp, SMS, Email), Ekko transforms how businesses manage appointments, customer reviews, and daily communication.

## 🚀 Core Functionality (What Ekko Actually Does)

### 🤖 1. Automated Messaging & Chatbots
Ekko isn't just a dashboard; it's an automation engine. It integrates with WhatsApp, SMS, and Email to provide:
*   **Intelligent Reminders**: Automatically sends 48-hour appointment reminders to reduce no-shows.
*   **Post-Visit Engagement**: Triggers "Thank You" messages and review requests immediately after a customer is marked as "Visited".
*   **No-Show Recovery**: Automatically reaches out to customers who missed their appointments to encourage rescheduling.
*   **External Workflows**: Uses n8n webhooks to handle real-time message delivery and processing.

### 📅 2. Comprehensive Appointment Management
Beyond simple booking, Ekko provides professional-grade scheduling tools:
*   **Live Sync**: Real-time synchronization with external sources like Google Sheets via n8n.
*   **Bulk Operations**: Fast CSV and Excel uploads for importing existing client databases.
*   **Manual Control**: Create, update, and track appointments with granular status management (Pending, Confirmed, Visited, Cancelled, Overdue).
*   **Customer History**: Track every interaction and visit for individual customers.

### 🌟 3. Reputation & Review Management
Maintain a high-quality brand presence by centralizing customer feedback:
*   **Review Aggregation**: Syncs reviews from external platforms into a single dashboard.
*   **Sentiment Tracking**: Monitor customer satisfaction at a glance with integrated rating systems.

### 📊 4. Advanced Business Analytics
Data-driven insights to help businesses grow:
*   **Conversion Metrics**: Track the ratio of conversations to successful bookings.
*   **Growth Trends**: Visualize weekly and monthly performance comparisons.
*   **KPI Tracking**: Monitor total appointments, active customers, and interaction volume.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS (Modern, Responsive UI)
- **Data Visualization:** Recharts
- **Icons:** Lucide React

### Backend
- **Framework:** Django & Django Rest Framework (DRF)
- **Database:** PostgreSQL
- **Worker/Tasks:** Celery & Redis (handles automated reminders)
- **Automation:** n8n Integration (Webhooks)
- **Authentication:** JWT for secure session management

---

## 🏗️ Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (for local frontend development)
- Git

### Quick Setup (Docker)

1. **Clone and Navigate:**
   ```bash
   git clone <repository-url>
   cd Ekko
   ```

2. **Environment Configuration:**
   Create a `.env` file in the root and frontend directories using the provided examples.

3. **Launch Containers:**
   ```bash
   docker compose up --build
   ```
   *Backend available at: `http://localhost:8000`*
   *Frontend available at: `http://localhost:3000`*

4. **Initialize Database:**
   ```bash
   docker compose exec backend python manage.py migrate
   docker compose exec backend python manage.py createsuperuser
   ```

---

## 📁 Project Structure

```text
Ekko/
├── backend/                   # Django REST API
│   ├── authentication/        # User management & RBAC
│   ├── chatbot/               # Automation, Messaging, & n8n Sync
│   └── core/                  # Project settings
├── frontend/                  # React/Vite Application
│   ├── src/pages/dashboard/   # Core Business Tools (Analytics, Appointments, etc.)
│   └── src/components/        # Reusable UI elements
└── docker-compose.yml         # Container orchestration
```

---

## 🔑 Business Configuration
The system is powered by the **Business Profile**. In `Settings`, businesses can define:
- **Operating Hours**: used by chatbots to manage booking expectations.
- **Services Offered**: dynamic lists available for appointment booking.
- **Booking Policies**: clear guidelines for customers during automated interactions.

---

## 📄 License
MIT License

---
*Developed for modern business automation.*
