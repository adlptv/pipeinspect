# PipeInspect — CI Pipeline Visualizer & Optimizer

> Parse, analyze, and optimize your CI/CD pipelines. Visualize DAGs, detect bottlenecks, estimate costs, and get actionable optimization suggestions.

![Pipeline](https://img.shields.io/badge/pipeline-analyzed-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Multi-Format CI Support
- **GitHub Actions** — Full workflow parser with `needs`, `steps`, and `runs-on` support
- **GitLab CI** — Stage-based pipeline parser with `script`, `before_script`, `after_script`
- **Jenkinsfile** — Declarative pipeline parser with parallel branch detection
- **CircleCI** — Workflow and job parser with `requires` dependency resolution

### Interactive DAG Visualization
- D3.js force-directed graph with drag, zoom, and pan
- Color-coded by stage (build, test, deploy)
- Critical path highlighted with ⭐
- Bottlenecks highlighted with ⚠️
- Click any node for detailed job information

### Bottleneck Detection & Optimization
- **Parallelization** — Identify sequential jobs that could run in parallel
- **Caching** — Detect missing dependency cache opportunities
- **Duplicate Removal** — Find jobs running identical commands
- **Job Splitting** — Suggest splitting long-running jobs
- **Runner Upgrades** — Recommend better runners for critical path jobs

### Cost Estimation
- Per-job cost breakdown with visual bars
- Monthly and yearly projections
- Potential savings from applied suggestions
- Configurable cost model per runner type

### Execution Timeline
- Gantt-style chart showing job execution order
- Sequential vs. parallelized duration comparison
- Stage-by-stage breakdown
- Wall time visualization

### Side-by-Side Comparison
- Compare before/after pipeline configurations
- Quantify time and cost savings
- Complexity score comparison
- Projected annual savings

### More
- Save and manage analyses (SQLite via Prisma)
- Export shields.io-style badges for your README
- Glassmorphism dark/light theme
- RESTful API with Zod validation
- Full test suite (Vitest + Playwright)

##
## 📸 Screenshots

| DAG Pipeline Visualization | Bottleneck Detection & Cost Estimation |
|:---:|:---:|
| ![Bottleneck Detection & Cost Estimation](screenshots/dashboard.png) |

> 💡 *Run locally to see the full interactive experience: `pnpm dev` then open http://localhost:3000*

 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pipeinspect.git
cd pipeinspect

# Install dependencies
npm install

# Set up the database
cp .env.example .env
npx prisma generate
npx prisma db push

# Start the dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Using Docker

```bash
# Build and run with docker-compose
docker-compose up -d

# Or build manually
docker build -t pipeinspect .
docker run -p 3000:3000 pipeinspect
```

## Usage

### 1. Import Your Pipeline
Go to the **Import** page and either:
- Paste your CI configuration directly
- Upload a `.yml`, `.yaml`, `.json`, or `.groovy` file
- Fetch from a raw GitHub/GitLab URL

### 2. Visualize the DAG
The **Visualize** page shows an interactive graph of your pipeline:
- Drag nodes to rearrange
- Scroll to zoom, drag background to pan
- Click nodes for job details
- Critical path and bottlenecks are automatically highlighted

### 3. Review Suggestions
The **Bottlenecks** page lists all optimization suggestions sorted by severity:
- **Critical** — High-impact issues
- **Warning** — Moderate improvements
- **Info** — Minor optimizations

### 4. Estimate Costs
The **Cost** page shows:
- Per-run, monthly, and yearly cost estimates
- Per-job cost breakdown
- Potential savings from suggestions

### 5. Compare Optimizations
The **Compare** page lets you paste before/after configs to see the impact:
- Time saved
- Cost reduced
- Complexity change

## API Reference

All API routes use Zod validation and return JSON.

### `POST /api/parse`
Parse a CI configuration into a structured pipeline.

```json
{
  "config": "name: CI\non: [push]\njobs: ...",
  "format": "github-actions"  // optional, auto-detected if omitted
}
```

### `POST /api/analyze`
Parse + analyze a CI configuration. Returns full analysis with suggestions, critical path, cost estimate, and complexity score.

### `POST /api/compare`
Compare two CI configurations.

```json
{
  "beforeConfig": "...",
  "afterConfig": "...",
  "format": "github-actions"  // optional
}
```

### `GET /api/analyses`
List saved analyses. Supports `?limit=` and `?offset=` query params.

### `POST /api/analyses`
Save a new analysis.

### `GET /api/analyses/:id`
Get a specific analysis by ID.

### `DELETE /api/analyses/:id`
Delete a saved analysis.

### `GET /api/export-badge`
Generate an SVG badge. Query params: `label`, `value`, `color` (blue|green|yellow|orange|red|purple).

### `GET /api/health`
Health check endpoint.

## Architecture

```
src/
├── app/
│   ├── api/              # Next.js API routes (Zod validated)
│   │   ├── parse/
│   │   ├── analyze/
│   │   ├── compare/
│   │   ├── analyses/
│   │   │   └── [id]/
│   │   ├── export-badge/
│   │   └── health/
│   ├── import/           # Import page
│   ├── visualize/        # DAG visualization
│   ├── bottlenecks/      # Optimization suggestions
│   ├── cost/             # Cost estimator
│   ├── timeline/         # Execution timeline
│   ├── compare/          # Side-by-side comparison
│   ├── analyses/         # Saved analyses list
│   │   └── [id]/         # Single analysis view
│   ├── settings/         # Settings page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Landing page
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # Reusable UI primitives (button, card, input, etc.)
│   ├── Navbar.tsx        # Top navigation bar
│   ├── Footer.tsx        # Footer
│   ├── ThemeToggle.tsx   # Dark/light toggle
│   ├── ThemeProvider.tsx # next-themes wrapper
│   ├── Hero.tsx          # Landing hero section
│   ├── ImportForm.tsx    # Pipeline import form
│   ├── DagGraph.tsx      # D3.js interactive DAG
│   ├── JobDetail.tsx     # Job detail side panel
│   ├── PipelineStats.tsx # Stats grid
│   ├── BottleneckPanel.tsx # Suggestions display
│   ├── CostEstimator.tsx # Cost breakdown
│   ├── Timeline.tsx      # Gantt-style timeline
│   ├── CompareView.tsx   # Comparison display
│   └── SuggestionCard.tsx # Individual suggestion card
├── lib/
│   ├── types/            # TypeScript type definitions
│   ├── parsers/          # CI config parsers (4 formats)
│   ├── analyzers/        # Pipeline analysis logic
│   ├── utils/            # Utility functions
│   ├── validation/       # Zod schemas
│   └── db/               # Prisma client & queries
└── prisma/
    └── schema.prisma     # Database schema
```

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.6 |
| UI | Tailwind CSS, Radix UI, Framer Motion |
| Visualization | D3.js 7 |
| Database | SQLite (Prisma ORM) |
| Validation | Zod |
| Testing | Vitest (unit), Playwright (E2E) |
| Icons | Lucide React |
| Fonts | Inter (Google Fonts) |

## Testing

```bash
# Run unit tests
npm test

# Run unit tests with coverage
npm test -- --coverage

# Run E2E tests (requires dev server running)
npm run test:e2e
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | SQLite database path |
| `GITHUB_TOKEN` | — | GitHub API token for private repos |
| `GITLAB_TOKEN` | — | GitLab API token |
| `GITLAB_URL` | `https://gitlab.com/api/v4` | GitLab API base URL |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `CORS_ORIGIN` | `*` | CORS allowed origins |
| `NEXT_PUBLIC_APP_NAME` | `PipeInspect` | App name |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | App URL |

## License

MIT

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.
