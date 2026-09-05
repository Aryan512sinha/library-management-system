# KL Book House — Library Management System

A web-based management dashboard for **KL Book House**, a physical library with 57 seats across 4 daily shifts. Built with Next.js (App Router), Firebase, and a 3D interactive building model.

> **Status:** This project is in an early/private stage. Security, testing, and several UX features are incomplete. See [Known Issues](#known-issues) and [Security](#security) for details.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Data Model](#data-model)
- [Authentication](#authentication)
- [3D Seat Map](#3d-seat-map)
- [Firestore Schema](#firestore-schema)
- [Scripts](#scripts)
- [Security](#security)
- [Known Issues](#known-issues)
- [Audit Report](#audit-report)
- [License](#license)

---

## Overview

KL Book House Library Management System is a single-page application (SPA) that allows library administrators to manage seat assignments, track student memberships, monitor payments/dues, and visualize seat occupancy through an interactive 3D building model. Students can log in to view their own seat, shift, and membership details.

The app has **no server-side routing or API routes** — all logic runs in the browser. Firebase handles authentication and data storage; the client communicates directly with Firestore.

---

## Features

### Admin — Overview Dashboard
- **Seat Management** — Assign, update, or remove student seat assignments across 57 seats and 4 shifts
- **Search by Seat Number** — Quickly look up any seat (1–57) to view or edit its assignment
- **Shift Occupancy Overview** — Bar chart showing seat utilization per shift (Morning, Midday, Afternoon, Evening)
- **Renewal Tracking** — List of memberships expiring within 14 days with color-coded urgency
- **Outstanding Dues** — Aggregated view of all unpaid/partially paid students with total amount
- **Live Firestore Data** — All data fetched from Cloud Firestore with manual refresh
- **Quick Action Panel** — One-click shortcut to assign a new student to a seat
- **Sidebar Navigation** — Switch between Overview, Students, and Payments & Dues views

### Admin — Students Page
- **Student Card Grid** — Every student presented as a clickable card showing initials, name, bill number, seat, shift(s), dues status chip, and expiry/chip status
- **Multi-Field Search** — Search across student name, seat number, bill number, or mobile number
- **Add Student** — Prompts for a seat number and opens the assignment panel directly
- **Quick Stats** — Total students, outstanding dues count, and renewals-to-watch count
- **Open/Edit Student** — Click any card to open the assignment panel pre-filled for that student

### Admin — Payments & Dues Page
- **Payment Mode Tracking** — Records whether each payment was collected in **cash** or **online**
- **Collection Summary** — Total collected, collected in cash, and collected online (with percentage breakdowns)
- **Students with Dues** — Grid of all students with outstanding amounts
- **Due Details Modal** — Tap a student to view seat, bill, shifts, status, amount paid, amount due, payment mode, and expiry; includes a **call-to-action** to phone the student

### Assignment Panel (CRUD)
- **Slide-in Panel** — Animated panel slides in from the right for creating/editing assignments
- **Form Fields** — Student name, bill number, mobile number, admission/expiry dates, shift(s), payment status, payment mode
- **Multi-Shift Selection** — Toggle buttons for selecting multiple shifts per student
- **Payment Tracking** — paid / partial / due status with amount fields
- **Payment Mode** — Cash or online selection
- **Delete with Confirmation** — Delete button with `window.confirm` guard
- **Firestore CRUD** — Create (`addDoc`), Update (`updateDoc`), Delete (`deleteDoc`)

### Student Dashboard
- **Membership Overview** — Displays seat number, shift(s), bill number, and expiry date
- **Payment Status** — Shows paid/due/partial status with amount details
- **Seat Map View** — Read-only 3D building model showing the assigned seat
- **Self-Service Refresh** — Students can refresh their own data from Firestore

### Authentication
- **Admin Login** — Firebase Authentication with email/password (only pre-configured admin accounts)
- **Student Login** — Firestore-based credential verification using bill number + registered mobile number
- **Role-Based Views** — Completely separate dashboards for admin vs. student roles

### 3D Interactive Building Model
- **Full Building Visualization** — 3D GLB model of the library rendered with React Three Fiber
- **Orbit Controls** — Drag to rotate, scroll to zoom
- **Environment Lighting** — Realistic warehouse preset lighting with shadows
- **Auto-Framing** — Camera positions itself based on model bounding box

> **Note:** Click-to-select a seat in the 3D model is **not functional** — the click handler passes the existing prop value rather than the actually clicked mesh. Seat selection is only possible through the search bar or by clicking student cards.

### UI/UX
- **Responsive Design** — Works on mobile, tablet, and desktop (sidebar collapses on smaller screens)
- **Dark/Light Mode** — Automatic theme switching based on system preference (`prefers-color-scheme`)
- **Slide-in Panel** — Animated assignment panel with CSS keyframe slide-in/slide-out
- **Toast Notifications** — Success/error feedback for all CRUD operations
- **Loading States** — Skeleton loading and spinner indicators during data fetches
- **Form Validation** — Client-side validation for all required fields (mobile number length, required fields, at least 1 shift selected)

---

## Architecture

### High-Level Architecture

```
app/page.tsx ──────────────────────────────────────────────
│  SPA entry point (useState-based client-side routing)    │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Login.tsx   │  │  Admin Views │  │   Student    │  │
│  │  (Firebase   │  │  (Overview,  │  │  Dashboard   │  │
│  │   Auth or    │  │   Students,  │  │  (read-only) │  │
│  │   Firestore  │  │   Payments)  │  │              │  │
│  │   query)     │  │              │  │              │  │
│  └──────────────┘  └──────┬───────┘  └──────────────┘  │
│                           │                              │
│                    AssignmentPanel                       │
│                    (CRUD operations)                     │
│                           │                              │
└───────────────────────────┼──────────────────────────────┘
                            │
                     DashboardShared.tsx
                     (AppShell, Logo, Stat, SeatMap)
                            │
                     library-model.tsx
                     (3D GLB viewer)
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         lib/firebase.ts  lib/library-data.ts
         (Auth + Firestore) (types, constants, helpers)
              │
         Firebase Cloud Firestore
```

### Client-Side Routing

The app uses React `useState` for client-side routing between views:

```
Login → Admin Overview
      │   ├── Students
      │   └── Payments & Dues
      → Student Dashboard
```

There is no server-side routing — the entire app runs as a single-page application. View swaps between the three admin screens and the student screen are handled in `page.tsx` through callback-driven sidebar navigation.

### State Management

- **View State** — `useState<View>` in `page.tsx` controls which screen is shown (`login | admin | student | students | payments`)
- **Sidebar Navigation** — `AppShell` receives `activeView` and `onNavigateOverview`/`onNavigateStudents`/`onNavigatePayments` callbacks from the parent
- **Assignment Data** — Fetched from Firestore on mount, stored in component state
- **Form State** — Local `useState` hooks in `AssignmentPanel` for form fields
- **Auth State** — Firebase Auth handles admin sessions; students are verified per-request with no persistent session

### Data Flow

```
Firebase Firestore
       ↓
loadAssignments() → assignments[] → Dashboard
       ↓                          ↓
  mapAssignmentDoc()        Occupancy, Dues, Expiry stats
       ↓
AssignmentPanel (CRUD) → Firestore → refresh
```

All data operations happen client-side via the Firebase SDK. There are **no API routes or server-side logic**.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.3.0 |
| **UI Library** | React | 19 |
| **Styling** | Tailwind CSS | 4.3.3 |
| **CSS Animations** | tw-animate-css | 1.4.0 |
| **Component Primitives** | @base-ui/react | 1.5.0 |
| **Variant Utilities** | class-variance-authority | 0.7.1 |
| **3D Rendering** | Three.js + React Three Fiber | 0.185.1 / 9.7.0 |
| **3D Helpers** | @react-three/drei | 10.7.8 |
| **Backend** | Firebase (Auth + Firestore) | 12.18.0 |
| **Icons** | Lucide React | 1.16.0 |
| **Analytics** | Vercel Analytics | 1.6.1 |
| **Language** | TypeScript | 5.7.3 |
| **Package Manager** | pnpm | — |

> **Note:** `eslint` is referenced in the `lint` script but is **not installed** as a dependency. Running `pnpm lint` will fail.

---

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout (metadata, favicons, analytics)
│   ├── page.tsx                # Main page — SPA entry with client-side routing
│   ├── globals.css             # Global styles (Tailwind v4, CSS variables, animations)
│   └── components/
│       ├── Login.tsx           # Admin/Student login form with landing page
│       ├── DashboardShared.tsx # Shared utilities, Logo, Stat, SeatMap, AppShell
│       ├── admindashboard.tsx  # Admin overview: stats, seat map, search, renewals, dues
│       ├── student_data.tsx    # Admin Students page: card grid + multi-field search
│       ├── PaymentsDuePage.tsx # Admin Payments & dues page: cash/online totals, due modal
│       ├── studentdashboard.tsx# Student read-only dashboard
│       └── AssignmentPanel.tsx # Slide-in panel for seat assignment CRUD (incl. payment mode)
├── components/
│   ├── library-model.tsx       # 3D building model (React Three Fiber + drei)
│   └── ui/
│       └── button.tsx          # shadcn/ui Button component (currently unused)
├── lib/
│   ├── firebase.ts             # Firebase initialization (Auth + Firestore)
│   ├── library-data.ts         # Constants, types, helper functions
│   └── utils.ts                # cn() utility (clsx + tailwind-merge, currently unused)
├── public/
│   ├── models/
│   │   ├── kl_boox_house6.glb  # Active 3D library building model (~112KB)
│   │   └── kl_boox_house_5.glb # Dead/broken stub (132 bytes)
│   ├── apple-icon.png          # Favicon variants
│   ├── icon.svg
│   ├── icon-light-32x32.png
│   ├── icon-dark-32x32.png
│   └── placeholder*.{svg,jpg,png} # Placeholder images (unused in code)
├── .env                        # Firebase environment variables (committed to git)
├── env.local                   # Duplicate of .env (also committed)
├── AUDIT.md                    # Independent security/quality audit report
├── next.config.mjs             # Next.js configuration
├── postcss.config.mjs          # PostCSS config (Tailwind)
├── tsconfig.json               # TypeScript configuration
├── components.json             # shadcn/ui configuration (base-nova style)
└── package.json                # Dependencies and scripts
```

### Dead Code

The following files/code exist but are **never imported or used** by any component:

| File/Code | Description |
|---|---|
| `components/ui/button.tsx` | shadcn Button component — all UI uses raw `<button>` elements |
| `lib/utils.ts` (`cn()`) | Proper `clsx`+`tailwind-merge` utility — components use a simpler `cn()` from `DashboardShared.tsx` instead |
| `MODEL_URL` / `MODEL_LOCAL_URL` in `library-data.ts` | References old model `kl_boox_house_5` — active code loads `kl_boox_house6` directly |
| `public/models/kl_boox_house_5.glb` | 132-byte broken/empty model file |
| `public/placeholder*.{svg,jpg,png}` | Placeholder images not referenced anywhere |

---

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- pnpm (package manager)
- Firebase project with Auth and Firestore enabled
- Firestore composite index on `billNo` + `mobileNo` (required for student login)

### Installation

```bash
# Clone the repository
git clone https://github.com/Aryan512sinha/library-management-system.git
cd library-management-system

# Install dependencies
pnpm install

# Set up environment variables
# Create .env from the variables listed under "Environment Variables" below

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000` (also accessible from `192.168.1.96` on LAN).

### Production Build

```bash
pnpm build
pnpm start
```

> **Note:** `pnpm build` will succeed but **skips all TypeScript errors** due to `ignoreBuildErrors: true` in `next.config.mjs`.

---

## Environment Variables

Create a `.env` file in the root directory with the following Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

All variables must be prefixed with `NEXT_PUBLIC_` to be accessible in client-side code.

> **Warning:** The `.env` file is currently committed to git. It should be added to `.gitignore` and the Firebase credentials rotated.

---

## Data Model

### Assignment (Firestore Document)

```typescript
type Assignment = {
  id?: string           // Firestore document ID
  seatNo: string        // Seat number (1–57)
  studentName: string   // Full name of the student
  billNo: string        // Unique bill/receipt number
  shiftIds: string[]    // Array of shift IDs: "morning" | "midday" | "afternoon" | "evening"
  admissionDate: string // ISO date string
  expiryDate: string    // ISO date string
  mobileNo: string      // 10-digit mobile number
  dueStatus: 'paid' | 'partial' | 'due'
  amountPaid: number    // Amount already paid (Rs)
  amountDue: number     // Outstanding amount (Rs)
  paymentMode?: 'cash' | 'online' // How the paid amount was collected
}
```

### Shifts

| ID | Name | Time |
|---|---|---|
| `morning` | Morning | 6:00 — 10:00 |
| `midday` | Midday | 10:00 — 14:00 |
| `afternoon` | Afternoon | 14:00 — 18:00 |
| `evening` | Evening | 18:00 — 22:00 |

### Seats

57 seats numbered `1` through `57`, generated procedurally in `library-data.ts`. Layout is a 6-per-row grid for 3D positioning purposes.

---

## Authentication

### Admin
- Uses **Firebase Authentication** with `signInWithEmailAndPassword`
- Only pre-configured Firebase accounts can log in
- Session managed by Firebase SDK
- Logout calls `signOut(auth)`

### Student
- Uses **Firestore query** — no Firebase Auth session
- Validates `billNo` + `mobileNo` against the `assignments` collection
- If a matching document exists, the student is logged in
- The matched assignment record is passed to the student dashboard
- **No persistent session** — refreshing the page logs the student out
- **No server-side verification** — the query runs entirely in the browser

### Role Separation
- Admin vs. student role is determined by which login method succeeded
- The role flag is stored in React state (`useState`) — it is **not a security boundary**
- All authorization is client-side; there are no Firestore security rules enforcing access

---

## 3D Seat Map

The 3D building model (`kl_boox_house6.glb`) is rendered using:

- **React Three Fiber** — React renderer for Three.js
- **@react-three/drei** — Helper components (OrbitControls, Environment, useGLTF)
- **GLB Format** — Binary glTF model of the library building

Features:
- Auto-centered camera based on model bounding box
- Warehouse environment lighting with blur background
- Drag to rotate, scroll to zoom
- Shadow rendering enabled

**Limitations:**
- Click-to-select a seat in the 3D model is **not functional** — the `SeatMap` component ignores the clicked mesh and always passes the existing `selectedSeat` prop
- Seat selection is only possible through the seat number search bar or by clicking student cards in the grid
- Pan is disabled in OrbitControls

---

## Firestore Schema

### Collection: `assignments`

Each document represents one student's seat assignment:

```
assignments/
  {docId}/
    seatNo: "1"
    studentName: "John Doe"
    billNo: "KL-1048"
    shiftIds: ["morning", "afternoon"]
    admissionDate: "2025-01-15"
    expiryDate: "2025-07-15"
    mobileNo: "9876543210"
    dueStatus: "paid"
    amountPaid: 5000
    amountDue: 0
    paymentMode: "cash" | "online"
```

### Indexes Required

- `billNo` + `mobileNo` (compound) — required for student login queries; must be manually created in the Firebase console

---

## Scripts

| Command | Description | Status |
|---|---|---|
| `pnpm dev` | Start development server on port 3000 | Working |
| `pnpm build` | Create production build (skips type errors) | Working (with caveats) |
| `pnpm start` | Start production server | Working |
| `pnpm lint` | Run ESLint | **Broken** — `eslint` not installed |

---

## Security

This project has **significant security concerns** that must be addressed before any production use. A detailed audit is available in `AUDIT.md` (scores the project 38/100 overall, Security 2/10).

### Critical Issues

1. **No Firestore security rules** — All student PII (names, mobile numbers, bills, payments) is readable and writable by anyone with the Firebase config. No `firestore.rules` file exists in the repo.

2. **No real student authentication** — Student "login" is a Firestore query run in the browser. There is no session, no token, and no way to prevent impersonation. Any user who knows a bill number and mobile can access that student's data.

3. **All authorization is client-side** — The admin/student role split is a `useState` flag, not a security boundary. A determined user could bypass it entirely.

4. **No uniqueness enforcement** — Duplicate seat assignments, bill numbers, and mobile numbers are possible at the database level.

5. **Hard delete with no undo** — The delete button in AssignmentPanel permanently removes data with only a `window.confirm` guard. No soft delete, no audit trail.

6. **Firebase credentials in git** — The `.env` file containing live Firebase API keys is committed to the repository.

### Recommendations

- Add Firestore security rules restricting read/write by role
- Implement Firebase Custom Claims or a backend API for admin authorization
- Add Firestore composite indexes and uniqueness constraints
- Implement soft delete with audit logging
- Remove `.env` from git history and rotate all credentials
- Add server-side input validation

---

## Known Issues

### Functional Issues

| # | Issue | Severity | Location |
|---|---|---|---|
| 1 | **3D seat click-to-select not functional** — `SeatMap` always passes the existing prop, ignoring the clicked mesh | Medium | `DashboardShared.tsx:133` |
| 2 | **Hardcoded "Good morning" greeting** — Does not change based on time of day | Low | `DashboardShared.tsx:258` |
| 3 | **Settings sidebar button non-functional** — Renders but has no `onClick` handler | Low | `DashboardShared.tsx` (AppShell) |
| 4 | **Student session not persistent** — Refreshing the page logs the student out | Medium | `page.tsx` (state-based auth) |
| 5 | **Placeholder contact info** — `ADMIN_CONTACT` uses `+91 00000 00000` and `klbookhouse@example.com` | Low | `library-data.ts` |
| 6 | **Dead model constants** — `MODEL_URL`/`MODEL_LOCAL_URL` reference old model `kl_boox_house_5` | Low | `library-data.ts` |

### Code Quality Issues

| # | Issue | Severity | Location |
|---|---|---|---|
| 7 | **`eslint` not installed** — `pnpm lint` will fail | Medium | `package.json` |
| 8 | **TypeScript errors ignored** — `ignoreBuildErrors: true` masks type issues | High | `next.config.mjs:3-4` |
| 9 | **Duplicate `cn()` utility** — `lib/utils.ts` (proper) vs `DashboardShared.tsx` (simplified, actually used) | Low | Multiple files |
| 10 | **Dead UI components** — `components/ui/button.tsx` never imported | Low | `components/ui/button.tsx` |
| 11 | **No tests** — Zero test files or test framework configured | High | Project-wide |
| 12 | **No CI/CD pipeline** | Medium | Project-wide |

### Infrastructure Issues

| # | Issue | Severity | Location |
|---|---|---|---|
| 13 | **`.env` committed to git** — Firebase credentials tracked in version control | Critical | `.env` |
| 14 | **Duplicate env file** — `env.local` contains identical credentials | Low | `env.local` |
| 15 | **No Firestore security rules** — All data publicly accessible | Critical | Missing `firestore.rules` |
| 16 | **No Firestore composite index in repo** — Must be manually created | Medium | Missing `firestore.indexes.json` |
| 17 | **Broken model stub** — `kl_boox_house_5.glb` is 132 bytes (empty/broken) | Low | `public/models/` |
| 18 | **Hardcoded dev IP** — `allowedDevOrigins: ['192.168.1.96']` in next.config | Low | `next.config.mjs` |

---

## Audit Report

A comprehensive security and quality audit is available in [`AUDIT.md`](./AUDIT.md) in the project root. Key scores:

| Category | Score |
|---|---|
| **Overall** | 38/100 |
| **Security** | 2/10 |
| **Production Readiness** | 18/100 |
| **Code Quality** | Moderate |
| **Architecture** | Functional but fragile |

---

## License

This project is private and proprietary. Unauthorized distribution is prohibited.
