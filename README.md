# 🔮 EXPORT AI — Enterprise B2B Export Sales Operating System
### Autonomous Buyer Discovery, AI Personalization & Wholesale Commercial Outreach

EXPORT AI is an enterprise-grade AI operating system built for international export sales teams specializing in Himalayan hand-hammered singing bowls, chakra tuning sets, and artisanal wellness instruments.

The platform integrates multi-source wholesale buyer discovery, Gemini 1.5 Flash commercial qualification, 6-stage automated Gmail outreach campaigns, proforma quotation generation (FOB/CIF/EXW), and a distributed RabbitMQ background worker cluster into a unified Linear × Attio-inspired interface.

---

## 🔗 Live Production Deployment & Demo

* 🌐 **Live Application:** [https://realestatecrm-sigma.vercel.app](https://realestatecrm-sigma.vercel.app)
* 📦 **GitHub Repository:** [https://github.com/naina766/real_estate_crm](https://github.com/naina766/real_estate_crm)

### 🔑 Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin / Export Director** | `admin@exportai.com` | `Admin@1234` | Full Command Center & Telemetry Access |
| **Sales Manager** | `manager@exportai.com` | `Agent@1234` | Campaigns, Leads, Pipeline & Quotations |

---

## 🌟 Key Architecture & Capabilities

```
                                  EXPORT AI PLATFORM ARCHITECTURE
                                  
     ┌─────────────────────────────────────────────────────────────────────────────┐
     │                       Next.js 16 App Router Frontend                        │
     │   • Export Sales Command Center          • 8-Stage Sales Pipeline Kanban    │
     │   • Buyer Discovery 12-Column Cockpit    • Proforma Quotation PDF Generator │
     │   • 60px/48px Dense Buyer CRM Directory  • 6-Step AI Outreach Campaign      │
     └──────────────────────────────────────┬──────────────────────────────────────┘
                                            │
                                            ▼
     ┌─────────────────────────────────────────────────────────────────────────────┐
     │                    Next.js API & Server Actions Layer                       │
     │   • JWT Session Authentication           • Rate-Limiting & Security         │
     │   • SSE Real-time Telemetry Stream       • Gmail OAuth 2.0 Token Manager    │
     └──────────────┬──────────────────────────────────────────────┬───────────────┘
                    │                                              │
                    ▼                                              ▼
     ┌──────────────────────────────┐              ┌──────────────────────────────┐
     │       Prisma ORM Layer       │              │  RabbitMQ Direct Exchange    │
     │  (PostgreSQL / SQLite)       │              │  (export.jobs.exchange)      │
     └──────────────────────────────┘              └──────────────┬───────────────┘
                                                                  │
                    ┌─────────────────────────────────────────────┴─────────────────────────────────────────────┐
                    ▼                             ▼                               ▼                             ▼
     ┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────────────┐
     │   discovery.queue (Worker)   │ │   validation.queue (Worker)  │ │      ai.queue (Worker)       │ │     email.queue (Worker)     │
     │ Multi-source Wholesale Crawl │ │ RFC-5322 & MX DNS Check      │ │ Gemini 1.5 Flash Scorer      │ │ Gmail API Safe Deliverability│
     └──────────────────────────────┘ └──────────────────────────────┘ └──────────────────────────────┘ └──────────────────────────────┘
```

---

## 🚀 Key Features

### 1. 📊 Export Sales Command Center (`/dashboard`)
- **6-KPI Unified Strip:** Real-time metrics for Total Buyers, Qualified Leads, Active Campaigns, Pipeline Value, Open Opportunities, and Win Rate.
- **70% Operations / 30% AI Split:** Live export pipeline progression, geographic market distribution, and real-time AI Sales Brief with Next Best Actions.

### 2. 🔍 Buyer Discovery Cockpit (`/discovery`)
- **12-Column Layout:** 7-column parameter configuration with preset product chips (*Tibetan Hand-Hammered*, *7 Chakra Tuning Sets*, *Full Moon Bowls*, *Crystal Quartz*, *Temple Gongs*), target market multi-select, and buyer persona segmented controls.
- **Live Terminal & 5-Step Pipeline:** Real-time 5-stage pipeline (*Search → Extract → Normalize → Validate → AI Score*) with filterable operations console.

### 3. 👥 Buyer Leads Directory & CRM (`/leads`)
- **Comfortable & Compact Density:** 60px default / 48px dense row height with sticky backdrop-blurred headers and keyboard navigation.
- **540px Slide-in Detail Drawer:** Tabbed CRM profile containing AI qualification breakdown, contact verification, outreach timeline, and action triggers.
- **Floating Bulk Actions:** Multi-select action bar for bulk campaign enrollment, qualification tagging, and CSV export.

### 4. ✉️ 6-Step Campaign Automation (`/campaigns`, `/campaigns/new`)
- **Campaign Wizard:** 6-step guided wizard (Details → Audience → Catalog Selection → AI Personalization Prompt → Gmail Deliverability Preview → Launch).
- **Gmail OAuth API Integration:** Directly dispatches personalized 1-on-1 cold outreach using official Gmail API credentials with rate-limiting and unsubscribe headers.

### 5. 📑 Proforma Commercial Quotation Builder (`/quotations`, `/quotations/new`)
- **Incoterms Support:** Instant calculation for FOB (Free On Board), CIF (Cost, Insurance, Freight), and EXW (Ex Works).
- **Live Document Preview Sheet:** Interactive PDF document generation with company seal, bank details, MOQ terms, and validity windows.

### 6. 💼 8-Stage Sales Pipeline Kanban (`/opportunities`)
- Visual drag-and-drop opportunity board (*Prospecting → Qualified → Contacted → Interested → Negotiation → Quotation → Closed Won → Closed Lost*) with currency formatting and deal inspection drawers.

### 7. ⚙️ Operations & RabbitMQ Telemetry Console (`/jobs`)
- Real-time queue metrics, worker cluster statuses, processing rates, retry counters, and dead-letter queue (DLX) inspection.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router with Turbopack) |
| **Frontend Library** | React 19, TypeScript, Tailwind CSS |
| **Animation & Motion** | Framer Motion (restrained enterprise animations) |
| **Icons** | Lucide React |
| **Database & ORM** | Prisma ORM (SQLite for local dev, PostgreSQL / Neon for production) |
| **Message Broker** | RabbitMQ (amqplib) with direct exchange and dead-letter queues |
| **AI Intelligence** | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| **Outreach Delivery** | Google Gmail API (`googleapis` OAuth 2.0) |
| **Authentication** | Custom JWT session management with bcrypt password hashing |
| **PDF Generation** | jsPDF & jsPDF-AutoTable |

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: `v18.17.0` or higher
- **npm** or **pnpm**
- **RabbitMQ** (Optional for full worker processing, app runs with built-in mock fallback)

---

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/real-estate-crm.git
cd real-estate-crm
npm install
```

---

### 2. Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Ensure your `.env` contains the required keys:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
TOKEN_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# Application URL
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# RabbitMQ Message Broker
RABBITMQ_URL="amqp://localhost:5672"
RABBITMQ_EXCHANGE="export.jobs.exchange"
RABBITMQ_DLX="export.dlx"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-1.5-flash"

# Google Gmail API OAuth 2.0
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/gmail/callback"
```

---

### 3. Initialize Database & Seed Sample Data

```bash
# Push schema and generate Prisma client
npx prisma db push
npx prisma generate

# Seed sample export buyers, products, and campaigns
npm run db:seed
```

---

### 4. Run the Background Workers (RabbitMQ)

In a separate terminal, launch the distributed worker processors:

```bash
npm run workers
```

---

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin / Export Director** | `admin@exportai.com` | `Admin@1234` |
| **Sales Manager** | `manager@exportai.com` | `Agent@1234` |
| **Sales Agent** | `agent@exportai.com` | `Agent@1234` |

---

## 📦 Production Build Verification

To test and create an optimized production build:

```bash
npm run build
npm run start
```

---

## 📂 Project Structure

```
real-estate-crm/
├── app/
│   ├── (auth)/                # Clean login & registration views
│   ├── (dashboard)/           # Authenticated application workspace
│   │   ├── dashboard/         # Command center overview
│   │   ├── discovery/         # 12-column buyer discovery cockpit
│   │   ├── leads/             # Buyer leads directory & detail drawer
│   │   ├── campaigns/         # 6-step campaign wizard & deliverability
│   │   ├── opportunities/     # 8-stage sales pipeline kanban
│   │   ├── quotations/        # Proforma quotation builder & PDF generator
│   │   ├── products/          # Wholesale product catalog
│   │   ├── ai-insights/       # Market intelligence center
│   │   ├── jobs/              # RabbitMQ telemetry console
│   │   ├── analytics/         # Export performance analytics
│   │   ├── documents/         # Export assets & certifications
│   │   └── settings/          # Gmail OAuth & Gemini AI credentials
│   └── api/                   # 27 REST & SSE endpoints
├── components/
│   ├── layout/                # TopNavbar (3-column grid), Sidebar, CommandPalette
│   ├── ui/                    # Centralized design system (Breadcrumbs, PageHeader, MetricStrip)
│   ├── discovery/             # Execution logs & pipeline trackers
│   ├── leads/                 # Table views & CRM detail sheets
│   └── quotations/            # Quotation invoice preview drawers
├── lib/
│   ├── ai/                    # Gemini 1.5 Flash scoring & fallback rules
│   ├── auth/                  # JWT session tokens & password hashing
│   ├── email/                 # Gmail API sender & RFC syntax validation
│   ├── rabbitmq/              # Message broker connection & publishers
│   └── prisma.ts              # Database connection singleton
├── prisma/
│   ├── schema.prisma          # Database schema models
│   └── seed.ts                # Realistic export dataset seed script
└── workers/                   # Standalone RabbitMQ background workers
```

---

## 🛡️ License

This project is proprietary and built for enterprise export sales automation.
