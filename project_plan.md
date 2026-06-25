# SYNGH TORQ - Project Plan

## 1. Project Description

**SYNGH TORQ** is a premium GPS Tracking, Fleet Intelligence and Vehicle Lifecycle Management Platform designed for enterprise fleet operators, logistics companies, and luxury vehicle owners.

**Product Positioning:** Luxury automotive technology platform delivering real-time fleet visibility, predictive maintenance insights, and AI-powered operational intelligence.

**Target Users:** Fleet managers, logistics operators, vehicle owners, service technicians, and enterprise administrators.

**Core Value:** Instant answers to critical fleet questions - "What is happening now?", "Which vehicles need attention?", "Where is my vehicle?", "How is it performing?"

**Design Personality:** Premium, Intelligent, Futuristic, Trustworthy, Clean, Enterprise, Data-rich, Easy for first-time users.

## 2. Page Structure

### Public Pages
- `/login` - User Login
- `/register` - User Registration
- `/forgot-password` - Password Reset

### Authenticated Pages (Mobile App Shell)
- `/dashboard` - Fleet Overview Dashboard (default after login)
- `/vehicles` - Vehicle List & Management
- `/vehicles/:id` - Vehicle Detail
- `/track` - Live GPS Tracking Map
- `/history` - Trip & Route History
- `/analytics` - Fleet Performance Analytics
- `/services` - Maintenance & Service Management
- `/more` - Settings, Profile, Help
- `/subscription` - Plan & Billing Management

## 3. Core Features

### Authentication
- [ ] User Registration with email
- [ ] User Login with email/password
- [ ] Password reset flow
- [ ] Session management

### Dashboard
- [ ] Fleet summary cards (total vehicles, moving, stopped, alerts)
- [ ] Live vehicle status list
- [ ] AI Insight cards with actionable intelligence
- [ ] Quick action shortcuts
- [ ] Recent alerts & notifications

### Vehicles
- [ ] Vehicle list with status badges
- [ ] Vehicle detail view with telemetry
- [ ] Vehicle status icons (ignition, AC, door, network, battery, charging)
- [ ] Fuel/consumption tracking
- [ ] Driver assignment

### Track
- [ ] Live GPS map view
- [ ] Vehicle location tracking
- [ ] Route visualization
- [ ] Geofence indicators

### History
- [ ] Trip timeline
- [ ] Route replay
- [ ] Stops and idle time tracking
- [ ] Distance and time metrics

### Analytics
- [ ] Fleet efficiency metrics
- [ ] Fuel consumption charts
- [ ] Driver behavior analytics
- [ ] Cost per KM tracking
- [ ] Maintenance cost trends

### Services
- [ ] Maintenance scheduling
- [ ] Service reminders
- [ ] Renewal tracking (insurance, permits)
- [ ] Expense management
- [ ] AI maintenance predictions

### Subscription & Billing
- [ ] Plan tiers display
- [ ] Current subscription status
- [ ] Usage metrics
- [ ] Upgrade/downgrade flows

### More / Settings
- [ ] User profile management
- [ ] Notification preferences
- [ ] Dark/Light mode toggle
- [ ] Help & support
- [ ] About / Legal

## 4. Data Model Design

### Supabase Tables (Future Implementation)

**users (managed by Supabase Auth)**
- id: uuid (primary key)
- email: string
- full_name: string
- company_name: string
- phone: string
- avatar_url: string
- role: enum (admin, manager, viewer)
- created_at: timestamp

**vehicles**
- id: uuid (primary key)
- user_id: uuid (foreign key)
- name: string
- plate_number: string
- vin: string
- make: string
- model: string
- year: integer
- color: string
- device_id: string
- status: enum (moving, stopped, idle, offline, maintenance)
- fuel_level: decimal
- odometer: decimal
- driver_id: uuid
- created_at: timestamp

**vehicle_telemetry**
- id: uuid (primary key)
- vehicle_id: uuid (foreign key)
- latitude: decimal
- longitude: decimal
- speed: decimal
- heading: decimal
- ignition: boolean
- ac_status: boolean
- door_status: boolean
- network_status: boolean
- battery_level: decimal
- charging: boolean
- recorded_at: timestamp

**trips**
- id: uuid (primary key)
- vehicle_id: uuid (foreign key)
- start_time: timestamp
- end_time: timestamp
- start_location: string
- end_location: string
- distance_km: decimal
- duration_minutes: integer
- max_speed: decimal
- idle_time: integer
- fuel_consumed: decimal

**maintenance_records**
- id: uuid (primary key)
- vehicle_id: uuid (foreign key)
- service_type: string
- description: text
- scheduled_date: date
- completed_date: date
- cost: decimal
- status: enum (scheduled, in_progress, completed, overdue)
- provider: string

**subscriptions**
- id: uuid (primary key)
- user_id: uuid (foreign key)
- plan_name: string
- plan_tier: enum (starter, professional, enterprise)
- vehicle_limit: integer
- price_monthly: decimal
- status: enum (active, trial, expired, cancelled)
- start_date: date
- end_date: date

## 5. Backend / Third-party Integration Plan

### Supabase
- **Auth:** User registration, login, password reset, session management
- **Database:** Vehicle data, telemetry, trips, maintenance records, subscriptions
- **Row Level Security:** Ensure users only access their own fleet data
- **Status:** Will connect for auth in Phase 1. Mock data for display until connected.

### Stripe (Phase 5)
- **Purpose:** Subscription billing for fleet management plans
- **Integration:** Checkout sessions for plan upgrades
- **Status:** Not connected yet - will implement in subscription phase

### Google Maps (Phase 2)
- **Purpose:** GPS tracking visualization
- **Integration:** Embedded map iframe for vehicle locations and routes

## 6. Development Phase Plan

### Phase 1: Design System & Authentication Shell
**Goal:** Build the complete mobile design system, app shell, navigation, and login/register screens.
**Deliverables:**
- Complete Tailwind design tokens (colors, typography, spacing, shadows)
- Reusable component library (cards, badges, buttons, inputs, bottom nav)
- Mobile app shell with viewport simulation (430px width, iPhone 16 Pro Max proportions)
- Dark/Light mode toggle system
- Login screen with Supabase auth integration
- Registration screen
- Dashboard screen with rich mock data

### Phase 2: Core Fleet Screens
**Goal:** Build Vehicles, Track, and History screens.
**Deliverables:**
- Vehicles list screen with status badges and search
- Vehicle detail screen with telemetry
- Live tracking map screen
- History/Timeline screen with trip records

### Phase 3: Intelligence & Analytics
**Goal:** Build Analytics, AI Insights, and Services screens.
**Deliverables:**
- Analytics dashboard with charts
- AI Insight cards throughout app
- Services & maintenance management screen
- Maintenance scheduling UI

### Phase 4: Management & More
**Goal:** Build profile, settings, notifications, and help screens.
**Deliverables:**
- Profile management
- Notification preferences
- App settings (theme, language)
- Help & support

### Phase 5: Subscription & Billing
**Goal:** Build plan management and Stripe payment integration.
**Deliverables:**
- Subscription plans display
- Current plan status
- Upgrade/downgrade flows
- Billing history
- Stripe checkout integration

### Phase 6: Polish & Connect Backend
**Goal:** Connect Supabase for real data, refine interactions, add animations.
**Deliverables:**
- Supabase database integration
- Real-time vehicle updates
- RLS policies
- Final UI polish and animations