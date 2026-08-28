// postStore.js

/**
 * Fetch metadata from D1
 */
export async function getPostMetadata(env, id) {
  const stmt = env.DB.prepare(
    `SELECT id, title, slug, created_at, updated_at FROM posts WHERE id = ?`
  );
  const result = await stmt.bind(id).first();
  return result || null;
}

/**
 * Fetch content JSON/MD from R2
 */
export async function getPostContent(env, id) {
  const object = await env.BUCKET.get(`posts/${id}.json`);
  if (!object) return null;

  const text = await object.text();
  return JSON.parse(text);
}

/**
 * Combined fetch: metadata + content
 */
export async function getPost(env, id) {
  const meta = await getPostMetadata(env, id);
  if (!meta) return null;

  const content = await getPostContent(env, id);
  return { ...meta, content };
}

/**
 * Create a new post
 */
export async function createPost(env, { id, title, slug, content }) {
  const now = new Date().toISOString();

  // 1. Insert metadata into D1
  await env.DB.prepare(
    `INSERT INTO posts (id, title, slug, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(id, title, slug, now, now)
    .run();

  // 2. Write content to R2
  await env.BUCKET.put(`posts/${id}.json`, JSON.stringify(content), {
    httpMetadata: { contentType: "application/json" }
  });

  return { id, title, slug, created_at: now, updated_at: now };
}

/**
 * Update an existing post
 */
export async function updatePost(env, { id, title, slug, content }) {
  const now = new Date().toISOString();

  // 1. Update metadata in D1
  await env.DB.prepare(
    `UPDATE posts SET title = ?, slug = ?, updated_at = ? WHERE id = ?`
  )
    .bind(title, slug, now, id)
    .run();

  // 2. Update content in R2
  await env.BUCKET.put(`posts/${id}.json`, JSON.stringify(content), {
    httpMetadata: { contentType: "application/json" }
  });

  return { id, title, slug, updated_at: now };
}

/**
 * Delete a post
 */
export async function deletePost(env, id) {
  // 1. Delete metadata
  await env.DB.prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run();

  // 2. Delete content
  await env.BUCKET.delete(`posts/${id}.json`);
}

/**
 * Get all metadata (for your table page)
 */
export async function listPosts(env) {
  const stmt = env.DB.prepare(
    `SELECT id, title, slug, updated_at FROM posts ORDER BY updated_at DESC`
  );
  const result = await stmt.all();
  return result.results || [];
}
