# Smart Campus Operations Hub

A full-stack web application designed for a university to manage facility and asset bookings, along with maintenance and incident ticketing. 

## Tech Stack
- **Backend:** Java 17, Spring Boot 3.2, Spring Security (OAuth2 + JWT), Spring Data JPA, MySQL
- **Frontend:** React 18, Vite, React Router, Axios, Custom CSS (Premium Dark Theme)
- **CI/CD:** GitHub Actions

## Project Structure
- `/backend`: Spring Boot Maven project containing the REST API.
- `/frontend`: Vite + React single-page application.

## Prerequisites
- Java 17+ and Maven
- Node.js 18+
- MySQL 8.0+
- Google Cloud Console account (for OAuth2 credentials)

## Setup Instructions

### 1. Database Configuration
Create a local MySQL database named `smart_campus`. The application will automatically create the required tables on the first run.

```sql
CREATE DATABASE smart_campus;
```

### 2. Backend Setup
1. Open `/backend/src/main/resources/application.yml`.
2. Update the `spring.datasource.username` and `password` if necessary.
3. Add your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for OAuth login.
4. Run the application:
```bash
cd backend
mvn spring-boot:run
```
The API will start on `http://localhost:8080`.

### 3. Frontend Setup
1. Install dependencies and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
2. Open `http://localhost:5173` in your browser.

## Features (Module Overview)
- **Module A (Catalogue):** Browse, search, filter, and manage resources (Rooms, Labs, Equipment).
- **Module B (Bookings):** Request resources with conflict detection (no overlapping time slots). Admins can approve/reject.
- **Module C (Ticketing):** Report incidents with image evidence (up to 3 images), assign technicians, and comment threads. Priority & status tracking.
- **Module D (Notifications):** Real-time bell alerts via backend Spring Events.
- **Module E (Auth):** Google OAuth2 login with Role-based Access Control (USER, ADMIN, TECHNICIAN).

## Author Details & Work Allocation
- Member 1: **[Name/ID]** - Facilities catalogue endpoints (Module A) & UI.
- Member 2: **[Name/ID]** - Booking workflow and conflict checking (Module B) & UI.
- Member 3: **[Name/ID]** - Incident ticketing and file uploads (Module C) & UI.
- Member 4: **[Name/ID]** - Notifications system and Auth/Security layer (Module D & E).

## Final Notes
Ensure that the `uploads` directory exists or the application has permissions to create it in the root directory, as ticket image attachments are stored locally.
