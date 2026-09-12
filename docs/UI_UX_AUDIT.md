# EXPORT AI — Comprehensive UI/UX Audit & Production Design Pass

**Product:** EXPORT AI — Enterprise B2B Export Sales Operating System  
**Repository:** `naina766/real_estate_crm`  
**Target Design Direction:** Linear × Attio × Modern Enterprise CRM  
**Date:** September 2026  
**Auditor:** Senior Staff Frontend Engineer & Design Systems Architect  

---

## 1. Executive Summary

### 1.1 Current Strengths
1. **Disciplined Enterprise Dark Palette:** The foundation uses `--bg-base: #070A0F` and slate surface tiers (`#0B0F14`, `#0F141D`) with tasteful indigo (`#6366F1`) and emerald (`#10B981`) accents. There are no distracting 3D meshes, WebGL animations, or flashy "landing page" gradients.
2. **Deep Domain Alignment:** The application correctly models international wholesale trade workflows: Incoterms (FOB, CIF, EXW), container quantities, acoustic frequency certification, RFC-5322 email syntax validation, and Gemini AI buyer qualification.
3. **Robust Backend Integration:** Unlike mockup-heavy prototypes, the dashboard KPIs, lead directory, pagination, job logs, and campaigns are wired to PostgreSQL/Prisma through Next.js App Router API endpoints with transactional outbox eventing.
4. **Rich Reusable Component Library:** The repository contains a comprehensive set of shared UI primitives (`Table`, `Badge`, `StatusBadge`, `MetricCard`, `DetailSheet`, `Tabs`, `BulkActionBar`, `NextBestAction`).

### 1.2 Current Weaknesses
1. **Global Action Bottleneck:** Top navigation features a singular hardcoded button `+ New Campaign` rather than a scalable `+ Create` command menu providing immediate access to Leads, Campaigns, Opportunities, Quotations, and Catalog Products.
2. **Discovery Workflow Confusion:** Technical crawler logs dominate 40% of the screen space on `/discovery`, pushing the primary commercial workflow (criteria setup, progress stages, and discovered buyer cards) below the fold.
3. **Hardcoded Telemetry in Jobs Page:** Worker throughput rates (`12 msg/s`, `140ms`) and sidebar connection badges (`RabbitMQ Connected`) are currently static and misleading rather than reflecting actual operational telemetry.
4. **Kanban Pipeline Viewport Constraints:** The 8-stage sales pipeline on `/opportunities` can suffer from compressed column widths on laptops and tablets without dedicated horizontal panning controls.
5. **Commercial Quotation UX Disconnect:** Incoterms (`FOB`, `CIF`, `EXW`) are buried within an ordinary form dropdown instead of functioning as a high-visibility commercial selector with instant logistics explanations.

### 1.3 Biggest UX Risks
- **Data Authenticity Skepticism:** Unclear delineation between live database aggregates and precomputed AI recommendations could lead users to suspect figures are fabricated.
- **Workflow Interruption:** Navigating between Buyer Discovery, Lead Details, and Quotation creation requires too many clicks without contextual shortcuts.
- **Mobile Clutter:** Deep data tables risk horizontal overflow or illegible clipped cell values on screens $\le 768\text{px}$.

### 1.4 Biggest Visual Inconsistencies
- Font sizes and padding across card headers vary between `p-4`, `p-5`, and `p-6`.
- Metric badges alternate between custom inline styles and tokens from `components/ui/index.tsx`.
- Sidebar navigation labels do not fully match the optimal enterprise grouping recommended in Section 5.

---

## 2. Page-by-Page Scoring Matrix

Scored on a scale of 1–10 across seven critical dimensions:
1. **VH:** Visual Hierarchy
2. **UC:** UX Clarity & Workflows
3. **ID:** Information Density & Polish
4. **CO:** System Consistency
5. **RB:** Responsive Behavior
6. **AC:** Accessibility & Focus States
7. **DA:** Data Authenticity & Realism

| Route | Primary Purpose | VH | UC | ID | CO | RB | AC | DA | Overall (/70) | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **`/dashboard`** | Command Center & Operations | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 9/10 | **57/70** | P1 Refine |
| **`/discovery`** | Buyer Search & Crawler Fleet | 6/10 | 7/10 | 7/10 | 7/10 | 7/10 | 7/10 | 8/10 | **49/70** | P0 Workflow |
| **`/leads`** | Wholesale Buyer Directory | 9/10 | 9/10 | 9/10 | 8/10 | 8/10 | 8/10 | 9/10 | **60/70** | P2 Polish |
| **`/leads/[id]`** | Buyer Dossier & AI Intelligence | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 9/10 | **57/70** | P1 Polish |
| **`/opportunities`** | 8-Stage Export Deal Kanban | 7/10 | 8/10 | 8/10 | 8/10 | 7/10 | 7/10 | 8/10 | **53/70** | P1 Responsive |
| **`/quotations/new`** | Commercial Proforma Generator | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 9/10 | **57/70** | P1 Incoterms |
| **`/campaigns/new`** | 6-Step Outreach Sequence Wizard | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 9/10 | **57/70** | P2 Polish |
| **`/jobs`** | Outbox & Worker Telemetry | 7/10 | 7/10 | 8/10 | 8/10 | 8/10 | 7/10 | 7/10 | **52/70** | P1 Authenticity |
| **`/analytics`** | High-Level Cohort & Yield Trends | 8/10 | 8/10 | 7/10 | 8/10 | 8/10 | 8/10 | 8/10 | **55/70** | P2 Polish |
| **`/products`** | Export Catalog & Harmonized Codes | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 9/10 | **57/70** | P2 Polish |

---

## 3. Findings Classification & Action Priorities

### 3.1 Priority P0 (Immediate Fixes — Misleading, Broken, or Disjointed)
1. **Discovery Screen Dominance by Raw Logs:** Move raw terminal streams into an expandable/collapsible drawer or console panel; establish a clean 3-part visual hierarchy: `Criteria Configuration` $\rightarrow$ `Discovery Progress Checklist` $\rightarrow$ `Discovered Buyer Highlights`.
2. **Static Broker Status Claims:** Remove hardcoded "RabbitMQ Connected" claims from sidebar/jobs footer; replace with active telemetry status or explicit indicator linking to `/jobs`.
3. **TopNavbar Single Action Bottleneck:** Replace single `+ New Campaign` with a multi-entity `+ Create` dropdown menu (`Buyer Lead`, `Campaign`, `Opportunity`, `Quotation`, `Product`).

### 3.2 Priority P1 (Important Product-Quality Improvements)
1. **Lead Detail Tab Completeness:** Ensure `/leads/[id]` features all five distinct CRM tabs: `Overview`, `AI Intelligence`, `Activity`, `Opportunities`, and `Follow-ups` with structured metadata and clear primary actions.
2. **Dashboard Command Center Hierarchy:** Elevate AI Next Actions directly alongside the 8-Stage Export Pipeline, providing high-context commercial recommendations with visible evidence cards.
3. **Opportunities Kanban Viewport Adaptability:** Add smooth horizontal scroll affordances, stage counters, and mobile stage selectors to prevent 8 columns from squeezing on smaller displays.
4. **Quotation Builder Incoterms UX:** Provide prominent segmented button toggles for `FOB`, `CIF`, `EXW`, `CFR`, and `DDP` with inline trade descriptions and a crystal-clear Proforma Invoice preview.
5. **Jobs Telemetry Authenticity:** Wire worker state indicators (`● Healthy`, `● Processing`, `● Degraded`, `● Offline`) directly to real database counters from `/api/jobs` without fabricated throughput rates.

### 3.3 Priority P2 (Polish & Consistency Improvements)
1. **Sidebar Organization:** Match the enterprise grouping standard: `WORKSPACE`, `SALES`, `INTELLIGENCE`, `CATALOG`, `OPERATIONS`, `SYSTEM`.
2. **Table Density & Empty States:** Ensure all table headers, badge alignments, and empty directory states provide actionable call-to-actions rather than generic "No data" strings.
3. **Loading Skeletons:** Standardize pulse skeleton placeholders across all asynchronous panels (KPI strips, Kanban columns, Lead tables).

### 3.4 Priority P3 (Enhancements & Ergonomics)
1. **Keyboard Shortcuts:** Ensure `⌘K` / `Ctrl+K` command palette and escape key actions work seamlessly across all dialogs and detail sheets.
2. **Tooltip Precision:** Ensure ISO country codes, HS product codes, and Incoterm definitions have accessible, high-contrast tooltips.

---

## 4. Implementation Roadmap
1. **Pass 1 — Design System & Global Layout:** Standardize `TopNavbar.tsx` (`+ Create` menu) and `Sidebar.tsx` (grouping & status indicator).
2. **Pass 2 — Command Center Dashboard:** Integrate AI Next Actions into pipeline hierarchy, polish 5-KPI strip, and ensure 8-stage click-throughs.
3. **Pass 3 — Buyer Discovery Workflow:** Clean 3-tier layout with collapsible execution terminal and immediate CRM conversion.
4. **Pass 4 — Lead Dossier Experience:** Refine `/leads` and `/leads/[id]` tabs, scoring rings, and contextual opportunity conversion.
5. **Pass 5 — Commercial Workflows:** Enhance Opportunities Kanban and Quotation Builder Incoterms selector.
6. **Pass 6 — Telemetry & Verification:** Clean Jobs telemetry, run automated tests, lint, TypeScript check, and Next.js production build.
