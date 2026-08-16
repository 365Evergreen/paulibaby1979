/**
 * Generates /content/posts/index.json from the Markdown frontmatter
 * in /content/posts/*.md -- this is the static content index that the
 * React app fetches at runtime.
 */

import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, basename } from "path";
import { existsSync } from "fs";

const POSTS_DIR = join(process.cwd(), "content", "posts");
const OUTPUT_DIR = join(process.cwd(), "public", "content", "posts");
const OUTPUT_FILE = join(OUTPUT_DIR, "index.json");

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };

  const frontmatter = {};
  const lines = match[1].split("\n");
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    frontmatter[key] = value;
  }

  return { data: frontmatter, body: match[2].trim() };
}

async function generate() {
  if (!existsSync(POSTS_DIR)) {
    console.log("No content/posts directory found, creating empty index");
    await mkdir(OUTPUT_DIR, { recursive: true });
    await writeFile(OUTPUT_FILE, "[]");
    return;
  }

  const files = await readdir(POSTS_DIR);
  const mdFiles = files.filter((f) => f.endsWith(".md"));

  const posts = [];
  for (const file of mdFiles) {
    const content = await readFile(join(POSTS_DIR, file), "utf-8");
    const { data } = parseFrontmatter(content);
    posts.push({
      id: basename(file, ".md"),
      title: data.title || "Untitled",
      excerpt: data.excerpt || "",
      date: data.date || "",
      coverImage: data.coverImage || null,
    });
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(posts, null, 2));
  console.log(`Generated content index with ${posts.length} posts`);
}

generate().catch(console.error);
