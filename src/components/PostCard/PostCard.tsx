import type { Post } from "../../hooks/usePosts"
import { formatDate } from "../../hooks/usePosts"
import styles from "./PostCard.module.css"

interface PostCardProps {
  post: Post
}

function TypeLabel({ type }: { type: Post["type"] }) {
  const labels: Record<Post["type"], string> = { article: "Article", audio: "Audio", video: "Video" }
  return <span className={`${styles.typeLabel} ${styles[`typeLabel--${type}`]}`}>{labels[type]}</span>
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className={styles.card}>
      {post.cover_image && (
        <a href={`/blog/${post.slug}`} className={styles.imageLink} tabIndex={-1} aria-hidden>
          <div className={styles.imageWrap}>
            <img
              src={post.cover_image}
              alt={post.title}
              loading="lazy"
              className={styles.image}
            />
            {post.type === "video" && (
              <div className={styles.playOverlay}>
                <span className={styles.playIcon}>▶</span>
              </div>
            )}
          </div>
        </a>
      )}

      <div className={styles.body}>
        <div className={styles.meta}>
          <time className={styles.date}>{formatDate(post.created_at)}</time>
          <TypeLabel type={post.type} />
        </div>

        <h3 className={styles.title}>
          <a href={`/blog/${post.slug}`} className={styles.titleLink}>
            {post.title}
          </a>
        </h3>

        {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}

        {post.type === "audio" && post.duration && (
          <p className={styles.duration}>{post.duration}</p>
        )}

        <a href={`/blog/${post.slug}`} className={styles.readMore}>
          {post.type === "audio" ? "Listen →" : post.type === "video" ? "Watch →" : "Read →"}
        </a>
      </div>
    </article>
  )
}
