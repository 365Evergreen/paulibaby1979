import { useState, useEffect } from "react"

export type PostType = "article" | "audio" | "video"

export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  cover_image: string | null
  type: PostType
  duration: string | null
  created_at: string
}

export interface PostDetail extends Post {
  content: unknown
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yy = String(d.getFullYear()).slice(2)
  return `${dd}/${mm}/${yy}`
}

async function fetchPosts(type?: PostType, limit = 50): Promise<Post[]> {
  const params = new URLSearchParams()
  if (type) params.set("type", type)
  params.set("limit", String(limit))

  // Try the Cloudflare Worker first (works in production)
  try {
    const workerRes = await fetch(`/api/posts?${params}`, { signal: AbortSignal.timeout(3000) })
    if (workerRes.ok) {
      const data = await workerRes.json()
      // If the worker returned HTML (SPA fallback), it's not available
      if (Array.isArray(data)) return data as Post[]
    }
  } catch {
    // Worker not available — no fallback to Supabase
  }

  // No Supabase fallback — return empty array if Worker unavailable
  return []
}

async function fetchPost(slug: string): Promise<PostDetail | null> {
  try {
    const workerRes = await fetch(`/api/posts/${slug}`, { signal: AbortSignal.timeout(3000) })
    if (workerRes.ok) {
      const data = await workerRes.json()
      if (data && typeof data === "object" && "id" in data) return data as PostDetail
    }
  } catch {
    // Worker unavailable — no fallback
  }

  // No Supabase fallback — return null
  return null
}

export function usePosts(type?: PostType, limit = 50) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchPosts(type, limit)
      .then((data) => { setPosts(data); setLoading(false) })
      .catch((e: Error) => { setError(e.message); setLoading(false) })
  }, [type, limit])

  return { posts, loading, error }
}

export function usePost(slug: string) {
  const [post, setPost] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    fetchPost(slug)
      .then((data) => { setPost(data); setLoading(false) })
      .catch((e: Error) => { setError(e.message); setLoading(false) })
  }, [slug])

  return { post, loading, error }
}