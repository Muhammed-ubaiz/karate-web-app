# SenseiBook 🥋 | Martial Arts Academy & Dojo Management System

A mobile-first Web Application designed for martial arts schools, karate dojos, taekwondo clubs, and combat sports academies. Built with a dark mode UI featuring obsidian charcoal backgrounds (`#121214`), crimson red accents (`#E50914`), gold badges, and crisp high-contrast typography.

---

## ⚡ Key Highlights & Core Modules

1. **Dashboard (Command Center)**:
   - Live Metric Cards: Active Students, Today's Attendance %, Overdue Fees count, and Blocked/Suspended Students.
   - Monthly Collection Progress Bar with Target vs. Collected percentage and 1-tap WhatsApp overdue broadcasts.
   - Quick Action Buttons: 'Take Attendance', 'Record Fee', 'Add Student'.
   - Recent Activity Feed: Real-time event log for registrations, fee receipts, and attendance.
   - Today's Class Batches card with live roster capacity meters.

2. **Branch / Dojo Locations Management**:
   - Multi-branch architecture with quick switcher in the top navigation bar.
   - Chief Instructor / Sensei assignment, address, contact phone, and student metrics.
   - Active/Inactive status toggle with mobile drawer modal for branch onboarding.

3. **Class Batches & Scheduling**:
   - Batch creation under designated Dojo branches.
   - Weekly schedule checkboxes (Mon-Sun), class start time, and duration (45–120 mins).
   - Real-time roster meter (`Enrolled / Max Capacity`) with visual threshold warnings.

4. **Fee Structures & Billing Management**:
   - Customizable tuition plans (1-month, 3-month quarterly, 12-month annual pass).
   - Line-item breakdown: Recurring Tuition Fee + One-Time Registration Fee.
   - Due Day of Month (1–28) and Active Billing Months selector.
   - Fast 'Record Payment' drawer modal with payment modes (UPI/GPay, Cash, POS, Bank Transfer) and WhatsApp receipt trigger.

5. **Student Registration & Roster**:
   - Detailed onboarding form: Photo avatar, DOB, Join Date, Email, Phone, WhatsApp with 'Same as Phone' toggle, Parent/Guardian contact, Dojo branch selector, Batch selector, Starting Belt Rank, Tuition Plan, One-Time Reg Fee checkbox, Medical info, and past martial arts experience.
   - Filterable student directory by Dojo, Belt rank, and Active/Blocked status.
   - Full student profile drawer with 1-click WhatsApp messaging (`https://wa.me/...`).

6. **Daily Batch Attendance Roll Call**:
   - 1-tap fast attendance toggle: `P` (Present), `A` (Absent), `L` (Late).
   - 'All Present' quick bulk action.
   - Instant WhatsApp notification trigger for parents of absent students.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your mobile device emulator or desktop browser.

### 3. Build for Production
```bash
npm run build
```

---

## 🏗️ Folder Structure

```
karate-webApp/
├── backend-architecture/
│   └── mongoModels.js            # Mongoose Schema models (MongoDB option)
├── prisma/
│   └── schema.prisma             # PostgreSQL schema (Supabase / Prisma ORM)
├── public/
├── src/
│   ├── components/
│   │   ├── attendance/
│   │   │   └── AttendanceView.jsx        # 1-tap batch roll call & absentee alerts
│   │   ├── batches/
│   │   │   ├── AddBatchModal.jsx         # Batch scheduler modal
│   │   │   └── BatchListView.jsx         # Batch cards & capacity progress
│   │   ├── dashboard/
│   │   │   ├── ActivityFeed.jsx          # Real-time event log
│   │   │   ├── CollectionProgress.jsx    # Monthly fee collection progress bar
│   │   │   ├── DashboardView.jsx         # Main command center
│   │   │   └── MetricCard.jsx            # KPI metric cards
│   │   ├── dojos/
│   │   │   ├── AddDojoModal.jsx          # Dojo branch onboarding drawer
│   │   │   └── DojoListView.jsx          # Branch management cards
│   │   ├── fees/
│   │   │   ├── AddFeePlanModal.jsx       # Tuition plan builder modal
│   │   │   ├── FeePlansView.jsx          # Fee structures & overdue table
│   │   │   └── RecordPaymentModal.jsx    # Fast payment collection modal
│   │   ├── layout/
│   │   │   ├── BottomNav.jsx             # Mobile-friendly bottom navigation bar
│   │   │   ├── DesktopTabs.jsx           # Tablet / desktop navigation tabs
│   │   │   ├── Navbar.jsx                # Header with Dojo switcher & role badge
│   │   │   └── Toast.jsx                 # Global notification banner
│   │   └── students/
│   │       ├── StudentListView.jsx       # Searchable student directory
│   │       ├── StudentProfileModal.jsx   # Student card & WhatsApp link
│   │       └── StudentRegistrationModal.jsx # Comprehensive onboarding form
│   ├── context/
│   │   └── DojoContext.jsx               # Global state store & LocalStorage persistence
│   ├── data/
│   │   └── mockData.js                   # Seed data for dojos, batches, fee plans & students
│   ├── App.jsx                           # Root application layout & router
│   ├── index.css                         # Tailwind CSS styling & custom belt colors
│   └── main.jsx                          # React DOM entrypoint
├── index.html                            # HTML5 template with Inter / Plus Jakarta Sans
├── package.json
├── tailwind.config.js                    # Dojo dark color theme config
└── vite.config.js                        # Vite configuration
```

---

## 🗄️ Database Schema & Role-Based Auth

### Roles:
- **`ADMIN`**: Multi-academy franchise owner. Can add/remove dojos, configure global fee plans, manage staff accounts.
- **`SENSEI`**: Chief instructor. Takes attendance, grades belts, records fees, sends WhatsApp notices.
- **`STAFF`**: Desk assistant. Registers new students, marks daily attendance, issues fee receipts.
