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
        "SELECT id, slug, title, excerpt, cover_image, created_at FROM posts WHERE published = 1 ORDER BY created_at DESC"
      ).all();
      return json(results.results);
    }

    // --- Public API: get single post by slug ---
    const postMatch = path.match(/^\/api\/posts\/([^/]+)$/);
    if (postMatch && method === "GET") {
      const slug = postMatch[1];
      const post = await env.DB.prepare(
        "SELECT * FROM posts WHERE slug = ? AND published = 1"
      ).bind(slug).first<Post>();
      if (!post) return json({ error: "Not found" }, 404);
      return json(post);
    }

    // --- Admin API: list all posts ---
    if (path === "/api/admin/posts" && method === "GET") {
      const results = await env.DB.prepare(
        "SELECT * FROM posts ORDER BY created_at DESC"
      ).all();
      return json(results.results);
    }

    // --- Admin API: create post ---
    if (path === "/api/admin/posts" && method === "POST") {
      const body = await request.json() as Partial<Post>;
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
      return json({ id: result.meta.last_row_id, slug }, 201);
    }

    // --- Admin API: get / update / delete post by ID ---
    const adminPostMatch = path.match(/^\/api\/admin\/posts\/(\d+)$/);
    if (adminPostMatch) {
      const id = parseInt(adminPostMatch[1]);

      if (method === "GET") {
        const post = await env.DB.prepare("SELECT * FROM posts WHERE id = ?")
          .bind(id).first<Post>();
        if (!post) return json({ error: "Not found" }, 404);
        return json(post);
      }

      if (method === "PUT") {
        const body = await request.json() as Partial<Post>;
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
        return json({ success: true });
      }

      if (method === "DELETE") {
        await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
        return json({ success: true });
      }
    }

    // --- Admin API: upload image to R2 ---
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

    // --- Admin API: list R2 objects ---
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

    // --- Fallback: serve static assets (SPA) ---
    return env.ASSETS.fetch(request);
  },
};
