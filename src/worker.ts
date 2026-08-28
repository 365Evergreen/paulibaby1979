/**
 * paulibaby1979 Worker
 * Blog API + Admin Panel
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

interface PostInput {
  slug?: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image: string | null;
  published: boolean;
}

const CORS = {
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
    {
      error: message,
    },
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

async function parsePostRequest(
  request: Request
): Promise<PostInput> {
  const body =
    await request.json();

  if (
    !body ||
    typeof body !== "object"
  ) {
    throw new Error(
      "Request body is required"
    );
  }

  const data =
    body as Record<
      string,
      unknown
    >;

  if (
    typeof data.title !==
      "string" ||
    !data.title.trim()
  ) {
    throw new Error(
      "Title is required"
    );
  }

  return {
    title: data.title.trim(),
    slug:
      typeof data.slug ===
      "string"
        ? data.slug.trim()
        : undefined,
    excerpt:
      typeof data.excerpt ===
      "string"
        ? data.excerpt
        : "",
    body:
      typeof data.body ===
      "string"
        ? data.body
        : "",
    cover_image:
      typeof data.cover_image ===
      "string"
        ? data.cover_image
        : null,
    published: Boolean(
      data.published
    ),
  };
}

async function getPostById(
  env: Env,
  id: number
) {
  return env.DB.prepare(
    "SELECT * FROM posts WHERE id = ?"
  )
    .bind(id)
    .first<Post>();
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

      // ==================================
      // PUBLIC POSTS
      // ==================================

      if (
        path === "/api/posts" &&
        method === "GET"
      ) {
        const posts =
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
          posts.results
        );
      }

      const slugMatch =
        path.match(
          /^\/api\/posts\/([^/]+)$/
        );

      if (
        slugMatch &&
        method === "GET"
      ) {
        const slug =
          slugMatch[1];

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

      // =========