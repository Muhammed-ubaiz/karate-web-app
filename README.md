# SenseiBook 🥋 | Martial Arts Academy & Dojo Management System

A mobile-first Web Application designed for martial arts schools, karate dojos, taekwondo clubs, and combat sports academies. Built with React 18, Vite, Tailwind CSS, Firebase Firestore (Real-Time Cloud DB & Offline Multi-Tab Persistence), Firebase Hosting, SweetAlert2, and Lucide React.

Live Web App: **https://karate-webapp-e2d53.web.app/**

---

## ⚡ Key Highlights & Core Features

1. **Dashboard & Command Center**:
   - Live metrics: Active Students, Attendance %, Unpaid Fees queue, and Dojo capacity.
   - Monthly Collection Progress Bar with dynamic targets based on student tuition plans.
   - Quick action shortcuts: 'Attendance', 'Record Fee', '+ Add Student'.
   - Recent Activity Log tracking all dojo events.

2. **Branch & Dojo Locations Management**:
   - Multi-branch architecture with quick switcher in the top navigation bar.
   - Chief Instructor / Sensei assignment, address, contact phone, and student metrics.
   - Direct Firebase Firestore synchronization across all devices.

3. **Class Batches & Scheduling**:
   - Batch creation under designated Dojo branches.
   - Weekly schedules (Weekly 3 days with 1 hr), class start time, and duration.
   - Real-time roster meter (`Enrolled / Max Capacity`) with threshold warnings.

4. **Fee Structures, Packages & 5% UAE VAT**:
   - Configured UAE Packages:
     - **Monthly Package**: 250 Dhs (Admission: 100 Dhs, Uniform: 125 Dhs)
     - **3 Months Package**: 650 Dhs (Admission: 100 Dhs, FREE Karate Uniform worth 125 Dhs)
     - **6 Months Package**: 1,200 Dhs (Admission: 100 Dhs, FREE Karate Uniform worth 125 Dhs)
     - **1 Year Package**: 2,200 Dhs (Admission: 100 Dhs, FREE Karate Uniform worth 125 Dhs)
     - **5% UAE VAT**: Automatically calculated on all bills and invoices.
   - **Admin Protected Editing**: Only verified administrators can create, edit, or delete fee structures.
   - **Printable Tax Invoices & Receipts**: Official PDF/print receipts with TRN numbers and line items.
   - **UAE Payment Methods**: Card / POS, Cash at Dojo, Bank Transfer, Apple Pay / GPay (No third-party Indian gateways).

5. **WhatsApp Fee Reminder Broadcast**:
   - Detects all students with unpaid fees (dueAmount > 0, status Pending/Overdue, or 30 days elapsed).
   - 1-tap WhatsApp fee reminders with pre-filled personalized messages containing exact Dhs amounts, 5% VAT notice, and schedule.
   - UAE mobile number cleaner (+971 formatting).

6. **Student Directory & Profile Management**:
   - Photo upload from device gallery + preset avatar picker.
   - Belt rank progression (White to 1st Dan Black Belt).
   - Medical notes, prior experience, and parent emergency contacts.
   - Admin-protected student deletion with SweetAlert confirmation dialogs.

7. **Batch Attendance Roll Call**:
   - 1-tap fast attendance toggle: `P` (Present), `A` (Absent), `L` (Late).
   - 'All Present' bulk marking.
   - Direct WhatsApp absentee alerts for parents.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite 6, Tailwind CSS
- **Database & Sync**: Firebase Firestore with `persistentLocalCache` (offline support) & `onSnapshot` real-time listeners
- **Hosting**: Firebase Hosting with immutable asset caching and HTTP security headers
- **UI Alerts & Modals**: SweetAlert2 + Tailwind Dark Obsidian Theme (`#121214`)
- **Icons**: Lucide React
- **PWA**: Installable Web App with `manifest.json` and mobile-optimized viewport

---

## 🚀 Setup & Deployment

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables (.env)
```env
VITE_FIREBASE_PROJECT_ID=karate-webapp-e2d53
VITE_FIREBASE_AUTH_DOMAIN=karate-webapp-e2d53.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=karate-webapp-e2d53.firebasestorage.app
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_MESSAGING_SENDER_ID=212299839451
VITE_FIREBASE_APP_ID=1:212299839451:web:...
```

### 3. Build & Deploy
```bash
npm run build
firebase deploy
```
