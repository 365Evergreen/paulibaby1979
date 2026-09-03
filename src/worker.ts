/**
 * paulibaby1979 Worker — Blog API + Admin Panel
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
  category_id: number | null;
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
      const results = await env.DB.prepare(
        `SELECT p.id, p.slug, p.title, p.excerpt, p.cover_image, p.created_at,
                c.id AS category_id, c.name AS category_name, c.slug AS category_slug
         FROM posts p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.published = 1
         ORDER BY p.created_at DESC`
      ).all();
      return json(results.results);
    }

    // --- Public API: get single post by slug ---
    const postMatch = path.match(/^\/api\/posts\/([^/]+)$/);
    if (postMatch && method === "GET") {
      const slug = postMatch[1];
      const post = await env.DB.prepare(
        `SELECT p.*, c.id AS category_id, c.name AS category_name, c.slug AS category_slug
         FROM posts p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.slug = ? AND p.published = 1`
      ).bind(slug).first<Post>();
      if (!post) return json({ error: "Not found" }, 404);
      return json(post);
    }

    // --- Admin API: list all posts ---
    if (path === "/api/admin/posts" && method === "GET") {
      const results = await env.DB.prepare(
        `SELECT p.*, c.id AS category_id, c.name AS category_name, c.slug AS category_slug
         FROM posts p
         LEFT JOIN categories c ON p.category_id = c.id
         ORDER BY p.created_at DESC`
      ).all();
      return json(results.results);
    }

    // --- Admin API: create post ---
    if (path === "/api/admin/posts" && method === "POST") {
      const body = await request.json() as Partial<Post>;
      const slug = body.slug || slugify(body.title || "untitled");
      const result = await env.DB.prepare(
        "INSERT INTO posts (slug, title, excerpt, body, cover_image, published, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        slug,
        body.title || "",
        body.excerpt || "",
        body.body || "",
        body.cover_image || null,
        body.published ? 1 : 0,
        body.category_id || null
      ).run();
      return json({ id: result.meta.last_row_id, slug }, 201);
    }

    // --- Admin API: get / update / delete post by ID ---
    const adminPostMatch = path.match(/^\/api\/admin\/posts\/(\d+)$/);
    if (adminPostMatch) {
      const id = parseInt(adminPostMatch[1]);

      if (method === "GET") {
        const post = await env.DB.prepare(
          `SELECT p.*, c.id AS category_id, c.name AS category_name, c.slug AS category_slug
           FROM posts p
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE p.id = ?`
        ).bind(id).first<Post>();
        if (!post) return json({ error: "Not found" }, 404);
        return json(post);
      }

      if (method === "PUT") {
        const body = await request.json() as Partial<Post>;
        const slug = body.slug || slugify(body.title || "untitled");
        await env.DB.prepare(
          "UPDATE posts SET slug = ?, title = ?, excerpt = ?, body = ?, cover_image = ?, published = ?, category_id = ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(
          slug,
          body.title || "",
          body.excerpt || "",
          body.body || "",
          body.cover_image || null,
          body.published ? 1 : 0,
          body.category_id || null,
          id
        ).run();
        return json({ success: true });
      }

      if (method === "DELETE") {
        await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
        return json({ success: true });
      }
    }

    // --- Admin API: upload image to R2 (legacy) ---
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

    if (path === "/api/admin/upload" && method === "GET") {
      const listed = await env.BUCKET.list();
      const objects = listed.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded.toISOString(),
        url: `https://media.paulibaby.com/${obj.key}`,
      }));
      return json(objects);
    }

    // --- Admin API: media library ---

    if (path === "/api/admin/media" && method === "GET") {
      const results = await env.DB.prepare(
        "SELECT * FROM media ORDER BY created_at DESC"
      ).all();
      return json(results.results);
    }

    if (path === "/api/admin/media" && method === "POST") {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      if (!file) return json({ error: "No file provided" }, 400);
      if (!file.type.startsWith("image/")) return json({ error: "Only image uploads are allowed" }, 400);

      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) return json({ error: "Maximum file size is 10MB" }, 400);

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

        await env.BUCKET.delete(media.r2_key);
        if (media.thumbnail_key) {
          try { await env.BUCKET.delete(media.thumbnail_key); } catch (e) { /* ignore */ }
        }
        await env.DB.prepare("DELETE FROM media WHERE id = ?").bind(id).run();
        return json({ success: true });
      }
    }

    // --- Admin API: categories ---

    if (path === "/api/admin/categories" && method === "GET") {
      const results = await env.DB.prepare(
        "SELECT * FROM categories ORDER BY name ASC"
      ).all<Category>();
      return json(results.results);
    }

    if (path === "/api/admin/categories" && method === "POST") {
      const body = await request.json() as { name: string; parent_id?: number | null };
      if (!body.name || !body.name.trim()) {
        return json({ error: "Category name is required" }, 400);
      }
      const slug = slugify(body.name);
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

    const categoryMatch = path.match(/^\/api\/admin\/categories\/(\d+)$/);
    if (categoryMatch && method === "DELETE") {
      const catId = parseInt(categoryMatch[1]);
      await env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(catId).run();
      return json({ success: true });
    }

    // --- Fallback: serve static assets (SPA) ---
    return env.ASSETS.fetch(request);
  },
};
