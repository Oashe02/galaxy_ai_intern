# NextFlow — AI Workflow Builder

A production-grade, node-based workflow automation platform inspired by [Krea.ai](https://krea.ai), built for composing LLM and media processing pipelines visually. Drag, connect, and execute complex AI workflows with real-time feedback and persistent history.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)

---

## ✨ Features

### 🎨 Visual Workflow Canvas
- **Drag-and-drop node editor** powered by React Flow
- **6 specialized node types**: Text, Upload Image, Upload Video, Run LLM, Crop Image, Extract Frame
- **Type-safe connections** — only compatible handle types can connect (text → text, image → image, video → video)
- **Cycle detection** — DAG validation prevents circular dependencies
- **Snap-to-grid** for clean layouts with mini-map navigation

### ⚡ DAG Execution Engine
- **Topological sorting** of the workflow graph into parallelizable layers
- **Layer-by-layer execution** — independent branches run simultaneously
- **Three execution modes**: Full Workflow, Selected Nodes, or Single Node
- **Real-time status indicators** on each node (idle → running → success/failed)
- Per-node execution timing and error reporting

### 🧠 AI & Media Processing
- **Google Gemini LLM** integration with configurable model, temperature, and system prompts
- **Image cropping** via Sharp with customizable coordinates
- **Video frame extraction** via FFmpeg with configurable timestamp
- All tasks execute via **Trigger.dev** for reliable background processing

### 💾 Persistence & History
- **Workflow save/load** to Neon PostgreSQL via Prisma ORM
- **Execution history** persisted to database with node-level detail
- **Expandable history entries** — click to see per-node status and timing
- **Export/Import** workflows as JSON files

### 🔐 Authentication
- **Clerk-powered** authentication with sign-up, sign-in, and session management
- All API routes are protected — workflows are scoped to the authenticated user

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js 16)              │
│  ┌─────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Zustand  │  │ React    │  │ DAG Runner        │  │
│  │ Store    │←→│ Flow     │  │ (Topological Sort │  │
│  │          │  │ Canvas   │  │  + Parallel Exec) │  │
│  └─────────┘  └──────────┘  └───────────────────┘  │
│         │                            │               │
│         ▼                            ▼               │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │ API Routes       │  │ Custom Event Dispatch    │  │
│  │ /api/workflows   │  │ window → node:run        │  │
│  │ /api/history     │  │ (triggers node execution)│  │
│  │ /api/run-llm     │  └──────────────────────────┘  │
│  │ /api/crop-image  │                                │
│  │ /api/extract-frame│                               │
│  │ /api/run-status  │                                │
│  └─────────────────┘                                 │
└──────────┬──────────────────────────────────────────┘
           │
           ▼
┌──────────────────┐    ┌──────────────────────────┐
│ Neon PostgreSQL  │    │ Trigger.dev              │
│ (Prisma ORM)     │    │ Background Task Runner   │
│                  │    │                          │
│ • Workflow table │    │ • runLLM (Gemini API)    │
│ • WorkflowRun    │    │ • cropImage (Sharp)      │
│   table          │    │ • extractFrame (FFmpeg)  │
└──────────────────┘    └──────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI Library | React 19 |
| Node Editor | React Flow (@xyflow/react) |
| State Management | Zustand |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Auth | Clerk |
| Database | Neon PostgreSQL |
| ORM | Prisma 6 |
| Task Runner | Trigger.dev |
| LLM | Google Gemini API |
| Image Processing | Sharp |
| Video Processing | FFmpeg (fluent-ffmpeg) |
| Animations | Framer Motion |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- FFmpeg installed (`brew install ffmpeg` on macOS)
- Accounts: [Clerk](https://clerk.com), [Neon](https://neon.tech), [Trigger.dev](https://trigger.dev), [Google AI Studio](https://aistudio.google.com)

### 1. Clone & Install

```bash
git clone https://github.com/Oashe02/galaxy_ai_intern.git
cd galaxy_ai_intern/nextflow
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/workflow
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/workflow

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Neon PostgreSQL
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Trigger.dev
TRIGGER_SECRET_KEY=tr_dev_...
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Servers

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — Trigger.dev worker
npx trigger.dev@latest dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
nextflow/
├── prisma/
│   └── schema.prisma          # Database schema (Workflow, WorkflowRun)
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login & Signup pages
│   │   ├── (protected)/
│   │   │   └── workflow/       # Main workflow page (dashboard + canvas)
│   │   ├── api/
│   │   │   ├── workflows/      # CRUD for workflow persistence
│   │   │   ├── history/        # Execution history endpoints
│   │   │   ├── run-llm/        # Trigger Gemini LLM task
│   │   │   ├── crop-image/     # Trigger image crop task
│   │   │   ├── extract-frame/  # Trigger video frame extraction
│   │   │   └── run-status/     # Poll task execution status
│   │   └── layout.tsx          # Root layout with Clerk provider
│   ├── components/
│   │   ├── canvas/             # WorkflowCanvas (React Flow wrapper)
│   │   ├── layout/             # Navbar
│   │   └── nodes/
│   │       ├── BaseNode.tsx    # Reusable node shell with handles
│   │       └── CustomNodes.tsx # All 6 node implementations
│   ├── lib/
│   │   ├── dagRunner.ts        # DAG execution engine
│   │   └── prisma.ts           # Prisma client singleton
│   ├── store/
│   │   └── useWorkflowStore.ts # Zustand store (nodes, edges, state)
│   ├── trigger/
│   │   ├── runLLM.ts           # Gemini API task
│   │   ├── cropImage.ts        # Sharp crop task
│   │   └── extractFrame.ts     # FFmpeg frame extraction task
│   └── middleware.ts           # Clerk auth middleware
├── .env                        # Environment variables
├── next.config.ts              # Next.js configuration
└── trigger.config.ts           # Trigger.dev configuration
```

---

## 🎯 Node Types

| Node | Inputs | Outputs | Description |
|------|--------|---------|-------------|
| **Text** | — | `text` | Static text input for prompts |
| **Upload Image** | — | `image` | File picker for images (PNG, JPG, WebP) |
| **Upload Video** | — | `video` | File picker for videos (MP4, WebM, MOV) |
| **Run LLM** | `system_prompt`, `user_message`, `images` | `output` | Gemini API call with vision support |
| **Crop Image** | `image` | `output` | Crop with x, y, width, height parameters |
| **Extract Frame** | `video` | `output` | Extract frame at specified timestamp |

---

## 📄 License

This project was built as an internship assignment for Galaxy AI.
