# Plan

## Plan: Refactor UI to Read Directly from Cloudflare D1 and R2

### Current Architecture Analysis

The project already uses Cloudflare D1 and R2, but through a Worker intermediary:

| Component | Current Data Path |
|-----------|-------------------|
| **Worker** (`src/worker.ts`) | Exposes `/api/posts`, `/api/posts/:slug`, `/api/media/:key`, `/api/admin/media` endpoints that query D1 (`env.DB`) and R2 (`env.BUCKET`) |
| **Frontend** (`src/hooks/usePosts.ts`) | Calls `/api/posts` via fetch, falls back to Supabase in dev/preview |
| **UI Components** | Consume API endpoints; cover images from R2 URLs stored in post metadata |
| **Config** (`wrangler.jsonc`) | Defines `DB` binding to D1 database and `BUCKET` binding to R2 bucket |

### Goal: Replace Existing Config to Call Cloudflare APIs Directly

Since this is "not a frontend exercise," the plan focuses on **config/backend changes** to enable UI elements to read directly from Cloudflare APIs.

### Key Configurations to Replace/Modify

1. **`wrangler.jsonc`** - Currently defines bindings. May need to add explicit API routes or modify bindings for direct access.

2. **`src/worker.ts`** - The `Env` interface and API routes. May need restructuring to expose raw D1/R2 access patterns.

3. **API Endpoint Strategy** - Decide whether UI calls:
   - **Option A**: Existing `/api/*` endpoints (current Worker pattern) ← *recommended*
   - **Option B**: Direct Cloudflare HTTP API calls from frontend (requires API tokens)
   - **Option C**: New Worker routes specifically for direct D1/R2 queries

### Plan Steps

**Step 1: Evaluate API Access Pattern**

- Cloudflare D1/R2 are primarily accessed via Worker bindings (current approach)
- Direct HTTP API calls possible but require:
  - Global API token with appropriate permissions
  - Account-level authentication
  - Rate limiting considerations
- **Recommendation**: Keep Worker pattern but ensure config is optimized

**Step 2: Update `wrangler.jsonc` Configuration**
Ensure bindings are properly configured:

```json
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "paulibaby1979",
  "compatibility_date": "2026-08-14",
  "main": "src/worker.ts",
  "assets": { "not_found_handling": "single-page-application" },
  "r2_buckets": [
    { "binding": "BUCKET", "bucket_name": "paulibaby-blog" }
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "paulibaby-blog-db",
      "database_id": "926d776f-9582-4a10-ac41-4cd5e295edd3",
      "remote": true
    }
  ]
}
```

**Step 3: Worker Config for Direct API Access**
The Worker already exposes the needed endpoints. Key considerations:
- Ensure `env.DB` and `env.BUCKET` are properly bound
- Add CORS headers if frontend is on different domain
- Optimize queries for UI needs (post lists, media lookup, etc.)

**Step 4: Update API Endpoints for UI Consumption**
The existing endpoints should work, but may need enhancement:
- `GET /api/posts?type=&limit=` - List posts (already has KV caching)
- `GET /api/posts/:slug` - Single post with content from R2
- `GET /api/media/:key` - Serve R2 files with proper Content-Type
- `GET /api/admin/media-library` - List media assets

**Step 5: Remove Supabase Fallback Dependency**
Since UI will read directly from Cloudflare:
- Update `src/hooks/usePosts.ts` to remove Supabase fallback (but this is frontend)
- Or keep fallback for development/preview environments

**Step 6: Verify D1 Schema & R2 Keys**
Ensure data model consistency:
- D1 `posts` table: `id, title, slug, excerpt, cover_image, type, duration, created_at, published`
- D1 `media` table: stores media metadata
- R2: `posts/{id}.json` for post content, media files in bucket root

### Implementation Recommendations

1. **Keep Worker Pattern** - Most secure and efficient approach
2. **Update `wrangler.jsonc`** - Ensure bindings match code expectations
3. **Add API Documentation** - Document each endpoint's D1/R2 operations
4. **Test with `wrangler dev`** - Verify local development works with direct API calls
5. **Deploy with `wrangler deploy`** - Push changes to Cloudflare

### What NOT to Change (per user request)

- ❌ Frontend UI component restructuring
- ❌ Removing Tiptap/RichTextEditor components  
- ❌ Changing React hook logic (per "not a frontend exercise")
- ❌ Modifying CSS/Styling

### Verification Checklist

- [ ] `wrangler.jsonc` bindings correctly point to D1/R2 resources
- [ ] Worker `src/worker.ts` `Env` interface matches bindings
- [ ] All API endpoints (`/api/posts`, `/api/media/:key`, etc.) respond correctly
- [ ] D1 queries return expected post metadata
- [ ] R2 bucket access works for `posts/{id}.json` and media files
- [ ] `wrangler deploy` succeeds without config errors

This plan focuses on the configuration and backend changes needed to ensure UI elements can read directly from Cloudflare D1 and R2 sources through the existing Worker infrastructure, without requiring frontend modifications.