/**
 * paulibaby1979 Worker — Blog API + Admin Panel
 * 
 * Routes:
 *   GET  /api/posts          → list published posts (?category=slug1,slug2 to filter)
 *   GET  /api/posts/:slug    → get single post
 *   GET  /api/admin/posts    → list all posts (?category=slug1,slug2 to filter)
 *   GET  /api/admin/posts/:id → get single post by ID
 *   POST /api/admin/posts    → create post (category_ids: number[])
 *   PUT  /api/admin/posts/:id → update post (category_ids: number[])
 *   DELETE /api/admin/posts/:id → delete post
 *   POST /api/admin/upload   → upload image to R2
 *   GET  /api/admin/upload   → list R2 objects
 *   GET  /api/admin/media       → list all media (with D1 metadata)
 *   POST /api/admin/media       → upload to R2 + insert metadata in D1
 *   GET  /api/admin/media/:id   → get single media record
 *   PUT  /api/admin/media/:id    → update media metadata
 *   DELETE /api/admin/media/:id  → delete from R2 + D1
 *   GET  /api/admin/media-library  → list ALL R2 objects (merged with D1 metadata)
 *   DELETE /api/admin/media-library → delete by r2_key (R2 + D1)
 *   GET  /api/admin/categories   → list all categories (flat)
 *   POST /api/admin/categories   → create category
 *   DELETE /api/admin/categories/:id → delete category
 */

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  ASSETS: Fetcher;
}

interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image: string | null;
  published: number;
  category_ids: number[];
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  created_at: string;
}

interface Media {
  id: number;
  r2_key: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string;
  title: string;
  caption: string;
  description: string;
  tags: string;
  uploaded_by: string;
  source_url: string;
  thumbnail_key: string;
  created_at: string;
  updated_at: string;
}

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Fetch all category IDs for a given post
async function getPostCategoryIds(db: D1Database, postId: number): Promise<number[]> {
  const rows = await db.prepare(
    "SELECT category_id FROM post_categories WHERE post_id = ?"
  ).bind(postId).all<{ category_id: number }>();
  return rows.results.map((r: { category_id: any; }) => r.category_id);
}

// Replace the set of categories on a post (delete all, then insert the new set)
async function syncPostCategories(db: D1Database, postId: number, categoryIds: number[]): Promise<void> {
  await db.prepare("DELETE FROM post_categories WHERE post_id = ?").bind(postId).run();
  if (categoryIds.length === 0) return;
  // D1 batch insert
  const stmts = categoryIds.map((catId) =>
    db.prepare("INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)")
      .bind(postId, catId)
  );
  await db.batch(stmts);
}

// Build a WHERE clause fragment for filtering posts by category slugs
function buildCategoryFilter(categoryParam: string | null): { clause: string; binds: string[] } | null {
  if (!categoryParam) return null;
  const slugs = categoryParam.split(",").map((s) => s.trim()).filter(Boolean);
  if (slugs.length === 0) return null;
  const placeholders = slugs.map(() => "?").join(",");
  return {
    clause: `p.id IN (SELECT pc.post_id FROM post_categories pc JOIN categories c ON pc.category_id = c.id WHERE c.slug IN (${placeholders}))`,
    binds: slugs,
  };
}

// Guess content type from file extension when metadata is missing
function guessContentType(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
    webp: "image/webp", svg: "image/svg+xml", avif: "image/avif", bmp: "image/bmp",
    ico: "image/x-icon",
    mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", m4a: "audio/mp4",
    flac: "audio/flac", aac: "audio/aac",
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", avi: "video/x-msvideo",
    mkv: "video/x-matroska", m4v: "video/mp4",
    pdf: "application/pdf",
    doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain", csv: "text/csv", json: "application/json", md: "text/markdown",
    zip: "application/zip", rar: "application/vnd.rar", "7z": "application/x-7z-compressed",
    tar: "application/x-tar", gz: "application/gzip",
  };
  return map[ext] || "application/octet-stream";
}

// Classify a content type + filename into a media type category
function classifyMediaType(contentType: string, key: string): "audio" | "document" | "image" | "video" | "other" {
  const ct = contentType.toLowerCase();
  const ext = key.split(".").pop()?.toLowerCase() || "";
  if (ct.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "bmp", "ico"].includes(ext)) return "image";
  if (ct.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "flac", "aac"].includes(ext)) return "audio";
  if (ct.startsWith("video/") || ["mp4", "webm", "mov", "avi", "mkv", "m4v"].includes(ext)) return "video";
  if (ct.startsWith("text/") || ct.includes("pdf") || ct.includes("msword") || ct.includes("officedocument") ||
    ct.includes("spreadsheet") || ct.includes("presentation") || ct.includes("json") ||
    ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "md"].includes(ext)) return "document";
  return "other";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    // --- Public API: list published posts ---
    if (path === "/api/posts" && method === "GET") {
      const catFilter = buildCategoryFilter(url.searchParams.get("category"));
      const whereClause = catFilter
        ? `WHERE p.published = 1 AND ${catFilter.clause}`
        : "WHERE p.published = 1";
      const results = await env.DB.prepare(
        `SELECT p.id, p.slug, p.title, p.excerpt, p.cover_image, p.created_at
         FROM posts p
         ${whereClause}
         ORDER BY p.created_at DESC`
      ).bind(...(catFilter?.binds ?? [])).all();
      // Attach category_ids to each post
      const postsWithCats = await Promise.all(
        results.results.map(async (p: any) => ({
          ...p,
          category_ids: await getPostCategoryIds(env.DB, p.id),
        }))
      );
      return json(postsWithCats);
    }

    // --- Public API: get single post by slug ---
    const postMatch = path.match(/^\/api\/posts\/([^/]+)$/);
    if (postMatch && method === "GET") {
      const slug = postMatch[1];
      const post = await env.DB.prepare(
        "SELECT * FROM posts WHERE slug = ? AND published = 1"
      ).bind(slug).first<Post>();
      if (!post) return json({ error: "Not found" }, 404);
      post.category_ids = await getPostCategoryIds(env.DB, post.id);
      return json(post);
    }

    // --- Admin API: list all posts ---
    if (path === "/api/admin/posts" && method === "GET") {
      const catFilter = buildCategoryFilter(url.searchParams.get("category"));
      const whereClause = catFilter ? `WHERE ${catFilter.clause}` : "";
      const results = await env.DB.prepare(
        `SELECT p.* FROM posts p ${whereClause} ORDER BY p.created_at DESC`
      ).bind(...(catFilter?.binds ?? [])).all();
      const postsWithCats = await Promise.all(
        results.results.map(async (p: any) => ({
          ...p,
          category_ids: await getPostCategoryIds(env.DB, p.id),
        }))
      );
      return json(postsWithCats);
    }

    // --- Admin API: create post ---
    if (path === "/api/admin/posts" && method === "POST") {
      const body = await request.json() as Partial<Post> & { category_ids?: number[] };
      const slug = body.slug || slugify(body.title || "untitled");
      const result = await env.DB.prepare(
        "INSERT INTO posts (slug, title, excerpt, body, cover_image, published) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(
        slug,
        body.title || "",
        body.excerpt || "",
        body.body || "",
        body.cover_image || null,
        body.published ? 1 : 0
      ).run();
      const newId = result.meta.last_row_id as number;
      const categoryIds = body.category_ids || [];
      if (categoryIds.length > 0) {
        await syncPostCategories(env.DB, newId, categoryIds);
      }
      return json({ id: newId, slug, category_ids: categoryIds }, 201);
    }

    // --- Admin API: get / update / delete post by ID ---
    const adminPostMatch = path.match(/^\/api\/admin\/posts\/(\d+)$/);
    if (adminPostMatch) {
      const id = parseInt(adminPostMatch[1]);

      if (method === "GET") {
        const post = await env.DB.prepare("SELECT * FROM posts WHERE id = ?")
          .bind(id).first<Post>();
        if (!post) return json({ error: "Not found" }, 404);
        post.category_ids = await getPostCategoryIds(env.DB, id);
        return json(post);
      }

      if (method === "PUT") {
        const body = await request.json() as Partial<Post> & { category_ids?: number[] };
        const slug = body.slug || slugify(body.title || "untitled");
        await env.DB.prepare(
          "UPDATE posts SET slug = ?, title = ?, excerpt = ?, body = ?, cover_image = ?, published = ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(
          slug,
          body.title || "",
          body.excerpt || "",
          body.body || "",
          body.cover_image || null,
          body.published ? 1 : 0,
          id
        ).run();
        // Sync categories (empty array clears all)
        await syncPostCategories(env.DB, id, body.category_ids || []);
        return json({ success: true });
      }

      if (method === "DELETE") {
        await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
        return json({ success: true });
      }
    }

    // --- Admin API: upload image to R2 (legacy, kept for backwards compat) ---
    if (path === "/api/admin/upload" && method === "POST") {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      if (!file) return json({ error: "No file provided" }, 400);

      const key = `${Date.now()}-${file.name}`;
      await env.BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type },
      });

      return json({
        key,
        url: `https://media.paulibaby.com/${key}`,
      }, 201);
    }

    // --- Admin API: list R2 objects (legacy) ---
    if (path === "/api/admin/upload" && method === "GET") {
      const listed = await env.BUCKET.list();
      const objects = listed.objects.map((obj: { key: any; size: any; uploaded: { toISOString: () => any; }; }) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded.toISOString(),
        url: `https://media.paulibaby.com/${obj.key}`,
      }));
      return json(objects);
    }

    // --- Admin API: media library ---

    // List all media with D1 metadata
    if (path === "/api/admin/media" && method === "GET") {
      const results = await env.DB.prepare(
        "SELECT * FROM media ORDER BY created_at DESC"
      ).all();
      return json(results.results);
    }

    // Upload: store file in R2 + insert metadata row in D1
    if (path === "/api/admin/media" && method === "POST") {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      if (!file) return json({ error: "No file provided" }, 400);

      const MAX_SIZE = 50 * 1024 * 1024;
      if (file.size > MAX_SIZE) return json({ error: "Maximum file size is 50MB" }, 400);

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const key = `${Date.now()}-${safeName}`;

      await env.BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type },
      });

      const altText = formData.get("alt_text");
      const title = formData.get("title");
      const caption = formData.get("caption");
      const description = formData.get("description");
      const tags = formData.get("tags");
      const uploadedBy = formData.get("uploaded_by");

      const result = await env.DB.prepare(
        `INSERT INTO media (r2_key, filename, content_type, size_bytes, alt_text, title, caption, description, tags, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        key,
        file.name,
        file.type,
        file.size,
        typeof altText === "string" ? altText : "",
        typeof title === "string" ? title : "",
        typeof caption === "string" ? caption : "",
        typeof description === "string" ? description : "",
        typeof tags === "string" ? tags : "",
        typeof uploadedBy === "string" ? uploadedBy : ""
      ).run();

      const media = await env.DB.prepare("SELECT * FROM media WHERE id = ?")
        .bind(result.meta.last_row_id).first<Media>();
      return json(media, 201);
    }

    // Get / update / delete single media by ID
    const mediaMatch = path.match(/^\/api\/admin\/media\/(\d+)$/);
    if (mediaMatch) {
      const id = parseInt(mediaMatch[1]);

      if (method === "GET") {
        const media = await env.DB.prepare("SELECT * FROM media WHERE id = ?")
          .bind(id).first<Media>();
        if (!media) return json({ error: "Media not found" }, 404);
        return json(media);
      }

      if (method === "PUT") {
        const body = await request.json() as Partial<Media>;
        const fields = ["alt_text", "title", "caption", "description", "tags"] as const;
        const updates: string[] = [];
        const values: string[] = [];
        for (const f of fields) {
          if (typeof body[f] === "string") {
            updates.push(`${f} = ?`);
            values.push(body[f] as string);
          }
        }
        if (updates.length === 0) return json({ error: "No updatable fields provided" }, 400);
        updates.push("updated_at = datetime('now')");
        values.push(String(id));
        await env.DB.prepare(`UPDATE media SET ${updates.join(", ")} WHERE id = ?`)
          .bind(...values).run();
        const media = await env.DB.prepare("SELECT * FROM media WHERE id = ?")
          .bind(id).first<Media>();
        return json(media);
      }

      if (method === "DELETE") {
        const media = await env.DB.prepare(
          "SELECT r2_key, thumbnail_key FROM media WHERE id = ?"
        ).bind(id).first<{ r2_key: string; thumbnail_key: string | null }>();
        if (!media) return json({ error: "Media not found" }, 404);

        // Delete the file from R2
        await env.BUCKET.delete(media.r2_key);
        if (media.thumbnail_key) {
          try { await env.BUCKET.delete(media.thumbnail_key); } catch (e) { /* ignore */ }
        }
        await env.DB.prepare("DELETE FROM media WHERE id = ?").bind(id).run();
        return json({ success: true });
      }
    }


    // Auth check — Access protects this path, so 200 = authenticated, 403 = not
    if (path === "/api/admin/auth-check" && method === "GET") {
      return json({ authenticated: true });
    }


    // --- Admin API: media library (all R2 objects merged with D1 metadata) ---

    // List ALL objects in the R2 bucket, merged with any D1 metadata
    if (path === "/api/admin/media-library" && method === "GET") {
      // Fetch all D1 media rows into a map keyed by r2_key
      const dbRows = await env.DB.prepare("SELECT * FROM media").all<Media>();
      const dbMap = new Map<string, Media>();
      for (const row of dbRows.results) {
        dbMap.set(row.r2_key, row);
      }

      // List ALL objects from R2 (handles pagination)
      const allObjects: { key: string; size: number; uploaded: Date; etag: string; httpMetadata?: { contentType?: string } }[] = [];
      let cursor: string | undefined;
      do {
        const listed = await env.BUCKET.list({ cursor });
        for (const obj of listed.objects) {
          allObjects.push({
            key: obj.key,
            size: obj.size,
            uploaded: obj.uploaded,
            etag: obj.etag,
            httpMetadata: obj.httpMetadata as { contentType?: string } | undefined,
          });
        }
        cursor = listed.truncated ? listed.cursor : undefined;
      } while (cursor);

      // Merge R2 objects with D1 metadata
      const items = allObjects.map((obj) => {
        const dbRow = dbMap.get(obj.key);
        const contentType = dbRow?.content_type || obj.httpMetadata?.contentType || guessContentType(obj.key);
        return {
          id: dbRow?.id ?? null,
          r2_key: obj.key,
          filename: dbRow?.filename || obj.key.split("/").pop() || obj.key,
          content_type: contentType,
          media_type: classifyMediaType(contentType, obj.key),
          size_bytes: dbRow?.size_bytes ?? obj.size,
          width: dbRow?.width ?? null,
          height: dbRow?.height ?? null,
          alt_text: dbRow?.alt_text ?? "",
          title: dbRow?.title ?? "",
          caption: dbRow?.caption ?? "",
          description: dbRow?.description ?? "",
          tags: dbRow?.tags ?? "",
          uploaded_by: dbRow?.uploaded_by ?? "",
          source_url: dbRow?.source_url ?? "",
          thumbnail_key: dbRow?.thumbnail_key ?? "",
          created_at: dbRow?.created_at ?? obj.uploaded.toISOString(),
          updated_at: dbRow?.updated_at ?? "",
          url: `https://media.paulibaby.com/${obj.key}`,
        };
      });

      // Sort by uploaded date descending
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return json(items);
    }

    // Delete by r2_key (removes from R2 and D1 if present)
    if (path === "/api/admin/media-library" && method === "DELETE") {
      const body = await request.json() as { r2_key: string };
      if (!body.r2_key) return json({ error: "r2_key is required" }, 400);

      await env.BUCKET.delete(body.r2_key);
      // Also remove from D1 if a row exists
      await env.DB.prepare("DELETE FROM media WHERE r2_key = ?").bind(body.r2_key).run();
      return json({ success: true });
    }

    // --- Admin API: categories ---

    // List all categories (flat — client builds the tree)
    if (path === "/api/admin/categories" && method === "GET") {
      const results = await env.DB.prepare(
        "SELECT * FROM categories ORDER BY name ASC"
      ).all<Category>();
      return json(results.results);
    }

    // Create a category
    if (path === "/api/admin/categories" && method === "POST") {
      const body = await request.json() as { name: string; parent_id?: number | null };
      if (!body.name || !body.name.trim()) {
        return json({ error: "Category name is required" }, 400);
      }
      const slug = slugify(body.name);
      // Ensure slug uniqueness
      const existing = await env.DB.prepare("SELECT id FROM categories WHERE slug = ?")
        .bind(slug).first();
      if (existing) {
        return json({ error: "A category with that slug already exists" }, 409);
      }
      const result = await env.DB.prepare(
        "INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)"
      ).bind(
        body.name.trim(),
        slug,
        body.parent_id || null
      ).run();
      const category = await env.DB.prepare("SELECT * FROM categories WHERE id = ?")
        .bind(result.meta.last_row_id).first<Category>();
      return json(category, 201);
    }

    // Delete a category
    const categoryMatch = path.match(/^\/api\/admin\/categories\/(\d+)$/);
    if (categoryMatch && method === "DELETE") {
      const catId = parseInt(categoryMatch[1]);
      // Junction table ON DELETE CASCADE removes the associations automatically
      await env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(catId).run();
      return json({ success: true });
    }

    // --- Fallback: serve static assets (SPA) ---
    return env.ASSETS.fetch(request);
  },
};
