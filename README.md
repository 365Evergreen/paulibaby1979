# Paulibaby Blog

A React SPA blog with a custom admin panel, powered by Cloudflare Workers, D1, and R2.

## Architecture

- **Frontend**: React 19 + Vite + TypeScript (SPA with react-router)
- **API**: Cloudflare Worker handles `/api/*` routes (CRUD + R2 uploads)
- **Database**: Cloudflare D1 (SQLite) for post content
- **Storage**: Cloudflare R2 (`paulibaby-blog` bucket) via `media.paulibaby.com`
- **Build**: Workers Builds (GitHub auto-deploy on push to `main`)

## Development

```bash
pnpm install

# Create local D1 database and run migrations
pnpm db:init:local

# Start dev server
pnpm dev
```

Open `http://localhost:5173` for the blog, `http://localhost:5173/admin` for the admin panel.

## Build & Deploy

```bash
# Build the frontend
pnpm build

# Deploy to Cloudflare Workers
npx wrangler deploy
```

Workers Builds runs `pnpm build` automatically on every push to `main`.

## Database Setup

### First time — create the D1 database

```bash
npx wrangler d1 create paulibaby-blog-db
```

Copy the `database_id` from the output into `wrangler.jsonc` (replace `PLACEHOLDER_RUN_pnpm_db_init`).

### Run migrations

```bash
# Local (for development)
pnpm db:init:local

# Remote (for production)
pnpm db:init
```

## Admin Panel

Navigate to `/admin` on your deployed site:

- **List view**: See all posts with published/draft status, edit and delete buttons
- **Edit view**: Form with title, slug, excerpt, cover image (upload to R2), Markdown body, publish toggle
- **Image upload**: Upload cover images directly to R2 via the admin panel
- **Instant updates**: No rebuild needed — content changes are live immediately

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/posts` | List published posts |
| GET | `/api/posts/:slug` | Get single published post |
| GET | `/api/admin/posts` | List all posts (incl. drafts) |
| GET | `/api/admin/posts/:id` | Get post by ID |
| POST | `/api/admin/posts` | Create post |
| PUT | `/api/admin/posts/:id` | Update post |
| DELETE | `/api/admin/posts/:id` | Delete post |
| POST | `/api/admin/upload` | Upload image to R2 |
| GET | `/api/admin/upload` | List R2 objects |

## Project Structure

```
├── migrations/
│   └── 0001_init.sql        # D1 schema + seed data
├── src/
│   ├── main.tsx             # React entry + router
│   ├── worker.ts            # Worker API (D1 + R2)
│   ├── pages/
│   │   ├── BlogList.tsx     # Blog listing page
│   │   ├── BlogPost.tsx     # Single post page
│   │   └── Admin.tsx        # Admin panel (CRUD + uploads)
│   └── index.css            # Global styles (blog + admin)
├── index.html               # HTML entry
├── vite.config.ts           # Vite + Cloudflare plugin
├── wrangler.jsonc           # Worker config (D1 + R2 bindings)
└── package.json
```

## R2 Storage

The Worker has an R2 binding (`BUCKET` to `paulibaby-blog`). The admin panel uploads images directly to R2, and they're served via `https://media.paulibaby.com/<filename>`.

## Workers Builds

- **Build command**: `pnpm build`
- **Deploy command**: `npx wrangler deploy`
- **Branch**: `main`
