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
  "Access-Control-Allow-Methods":
    "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type",
};

function json(
  data: unknown,
  status = 200
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",
        ...CORS,
      },
    }
  );
}

function error(
  message: string,
  status = 400
): Response {
  return json(
    { error: message },
    status
  );
}

function slugify(
  text: string
): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default {
  async fetch(
    request: Request,
    env: Env
  ): Promise<Response> {
    try {
      const url = new URL(
        request.url
      );

      const path =
        url.pathname;

      const method =
        request.method;

      if (
        method === "OPTIONS"
      ) {
        return new Response(
          null,
          {
            headers: CORS,
          }
        );
      }

      // ======================
      // PUBLIC POSTS
      // ======================

      if (
        path === "/api/posts" &&
        method === "GET"
      ) {
        const results =
          await env.DB.prepare(
            `
            SELECT
              id,
              slug,
              title,
              excerpt,
              cover_image,
              created_at
            FROM posts
            WHERE published = 1
            ORDER BY created_at DESC
          `
          ).all();

        return json(
          results.results
        );
      }

      const publicMatch =
        path.match(
          /^\/api\/posts\/([^/]+)$/
        );

      if (
        publicMatch &&
        method === "GET"
      ) {
        const slug =
          publicMatch[1];

        const post =
          await env.DB.prepare(
            `
            SELECT *
            FROM posts
            WHERE slug = ?
            AND published = 1
          `
          )
            .bind(slug)
            .first<Post>();

        if (!post) {
          return error(
            "Post not found",
            404
          );
        }

        return json(post);
      }

      // ======================
      // ADMIN - LIST POSTS
      // ======================

      if (
        path ===
          "/api/admin/posts" &&
        method === "GET"
      ) {
        const results =
          await env.DB.prepare(
            `
            SELECT *
            FROM posts
            ORDER BY created_at DESC
          `
          ).all();

        return json(
          results.results
        );
      }

      // ======================
      // ADMIN - CREATE POST
      // ======================

      if (
        path ===
          "/api/admin/posts" &&
        method === "POST"
      ) {
        const body =
          (await request.json()) as Record<
            string,
            unknown
          >;

        if (
          typeof body.title !==
            "string" ||
          !body.title.trim()
        ) {
          return error(
            "Title is required"
          );
        }

        const title =
          body.title.trim();

        const slug =
          typeof body.slug ===
            "string" &&
          body.slug.trim()
            ? body.slug.trim()
            : slugify(title);

        const existing =
          await env.DB.prepare(
            `
            SELECT id
            FROM posts
            WHERE slug = ?
          `
          )
            .bind(slug)
            .first();

        if (existing) {
          return error(
            "Slug already exists",
            409
          );
        }

        const result =
          await env.DB.prepare(
            `
            INSERT INTO posts
            (
              slug,
              title,
              excerpt,
              body,
              cover_image,
              published
            )
            VALUES (?, ?, ?, ?, ?, ?)
          `
          )
            .bind(
              slug,
              title,
              typeof body.excerpt ===
                "string"
                ? body.excerpt
                : "",
              typeof body.body ===
                "string"
                ? body.body
                : "",
              typeof body.cover_image ===
                "string"
                ? body.cover_image
                : null,
              body.published
                ? 1
                : 0
            )
            .run();

        const post =
          await env.DB.prepare(
            `
            SELECT *
            FROM posts
            WHERE id = ?
          `
          )
            .bind(
              result.meta
                .last_row_id
            )
            .first<Post>();

        return json(
          post,
          201
        );
      }

      // ======================
      // ADMIN POST BY ID
      // ======================

      const adminMatch =
        path.match(
          /^\/api\/admin\/posts\/(\d+)$/
        );

      if (adminMatch) {
        const id = Number(
          adminMatch[1]
        );

        if (
          !Number.isInteger(id) ||
          id < 1
        ) {
          return error(
            "Invalid post id"
          );
        }

        // ----------
        // GET
        // ----------

        if (
          method === "GET"
        ) {
          const post =
            await env.DB.prepare(
              `
              SELECT *
              FROM posts
              WHERE id = ?
            `
            )
              .bind(id)
              .first<Post>();

          if (!post) {
            return error(
              "Post not found",
              404
            );
          }

          return json(post);
        }

        // ----------
        // PUT
        // ----------

        if (
          method === "PUT"
        ) {
          const body =
            (await request.json()) as Record<
              string,
              unknown
            >;

          if (
            typeof body.title !==
              "string" ||
            !body.title.trim()
          ) {
            return error(
              "Title is required"
            );
          }

          const title =
            body.title.trim();

          const slug =
            typeof body.slug ===
              "string" &&
            body.slug.trim()
              ? body.slug.trim()
              : slugify(title);

          const duplicate =
            await env.DB.prepare(
              `
              SELECT id
              FROM posts
              WHERE slug = ?
              AND id != ?
            `
            )
              .bind(
                slug,
                id
              )
              .first();

          if (duplicate) {
            return error(
              "Slug already exists",
              409
            );
          }

          await env.DB.prepare(
            `
            UPDATE posts
            SET
              slug = ?,
              title = ?,
              excerpt = ?,
              body = ?,
              cover_image = ?,
              published = ?,
              updated_at = datetime('now')
            WHERE id = ?
          `
          )
            .bind(
              slug,
              title,
              typeof body.excerpt ===
                "string"
                ? body.excerpt
                : "",
              typeof body.body ===
                "string"
                ? body.body
                : "",
              typeof body.cover_image ===
                "string"
                ? body.cover_image
                : null,
              body.published
                ? 1
                : 0,
              id
            )
            .run();

          const post =
            await env.DB.prepare(
              `
              SELECT *
              FROM posts
              WHERE id = ?
            `
            )
              .bind(id)
              .first<Post>();

          return json(post);
        }

        // ----------
        // DELETE
        // ----------

        if (
          method ===
          "DELETE"
        ) {
          await env.DB.prepare(
            `
            DELETE FROM posts
            WHERE id = ?
          `
          )
            .bind(id)
            .run();

          return json({
            success: true,
          });
        }
      }

      // ======================
      // IMAGE UPLOAD
      // ======================

      if (
        path ===
          "/api/admin/upload" &&
        method === "POST"
      ) {
        const formData =
          await request.formData();

        const file =
          formData.get("file");

        if (
          !(file instanceof File)
        ) {
          return error(
            "No file provided"
          );
        }

        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          return error(
            "Only image uploads are allowed"
          );
        }

        const MAX_SIZE =
          5 * 1024 * 1024;

        if (
          file.size >
          MAX_SIZE
        ) {
          return error(
            "Maximum file size is 5MB"
          );
        }

        const safeName =
          file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
          );

        const key =
          `${Date.now()}-${safeName}`;

        await env.BUCKET.put(
          key,
          file.stream(),
          {
            httpMetadata: {
              contentType:
                file.type,
            },
          }
        );

        return json(
          {
            key,
            url: `https://media.paulibaby.com/${key}`,
          },
          201
        );
      }

      // ======================
      // LIST UPLOADS
      // ======================

      if (
        path ===
          "/api/admin/upload" &&
        method === "GET"
      ) {
        const listed =
          await env.BUCKET.list();

        return json(
          listed.objects.map(
            (obj: { key: any; size: any; uploaded: { toISOString: () => any; }; }) => ({
              key: obj.key,
              size: obj.size,
              uploaded:
                obj.uploaded.toISOString(),
              url: `https://media.paulibaby.com/${obj.key}`,
            })
          )
        );
      }

      // ======================
      // FALLBACK
      // ======================

      return env.ASSETS.fetch(
        request
      );
    } catch (err) {
      console.error(err);

      return error(
        err instanceof Error
          ? err.message
          : "Internal server error",
        500
      );
    }
  },
};