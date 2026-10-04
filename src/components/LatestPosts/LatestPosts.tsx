import { useState } from "react"
import { usePosts, type Post } from "../../hooks/usePosts"
import styles from "./LatestPosts.module.css"

const INITIAL = 5    // 2 lead + 3 secondary visible initially
const PAGE_SIZE = 10

/** "DD MM YYYY" format matching the design's meta line */
function formatLong(raw: string): string {
  const d = new Date(raw.replace(" ", "T"))
  if (isNaN(d.getTime())) return raw
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd} ${mm} ${yyyy}`
}

function VideoIndicator() {
  return (
    <div className={styles.videoIndicator} aria-hidden>
      <img src="/video-indicator.svg" alt="" width={26} height={22} />
    </div>
  )
}

/** Large lead card — full column width, tall image */
function LeadCard({ post }: { post: Post }) {
 const typeLabel = post.type?.toUpperCase() ?? ""
  return (
    <article className={styles.leadCard} data-node-id="4:376">
      <a href={`/blog/${post.slug}`} className={styles.imageLink}>
        <div className={styles.leadImageWrap} data-node-id="4:377">
          {post.cover_image
            ? <img src={post.cover_image} alt={post.title} className={styles.image} loading="eager" />
            : <div className={styles.imagePlaceholder} />
          }
          {(post.type === "video" || post.type === "audio") && <VideoIndicator />}
        </div>
      </a>
      <div className={styles.postDetails} data-node-id="4:382">
        <p className={styles.title} data-node-id="4:383">
          <a href={`/blog/${post.slug}`} className={styles.titleLink}>{post.title}</a>
        </p>
        <p className={styles.metaLine} data-node-id="4:384">
          {typeLabel} | {formatLong(post.created_at)}
        </p>
      </div>
    </article>
  )
}

/** Smaller secondary card — 4-col grid row */
function SecondaryCard({ post }: { post: Post }) {
const typeLabel = post.type?.toUpperCase() ?? ""
  return (
    <article className={styles.secondaryCard} data-node-id="4:393">
      <a href={`/blog/${post.slug}`} className={styles.imageLink}>
        <div className={styles.secondaryImageWrap} data-node-id="4:394">
          {post.cover_image
            ? <img src={post.cover_image} alt={post.title} className={styles.image} loading="lazy" />
            : <div className={styles.imagePlaceholder} />
          }
          {(post.type === "video" || post.type === "audio") && <VideoIndicator />}
        </div>
      </a>
      <div className={styles.postDetails} data-node-id="4:399">
        <p className={styles.title} data-node-id="4:400">
          <a href={`/blog/${post.slug}`} className={styles.titleLink}>{post.title}</a>
        </p>
        <p className={styles.metaLine} data-node-id="4:401">
          {typeLabel} | {formatLong(post.created_at)}
        </p>
      </div>
    </article>
  )
}

function Skeleton() {
  return (
    <section className={styles.section}>
      <p className={styles.sectionHeading}>ARTICLES</p>
      <div className={styles.leadRow}>
        <div className={styles.skeletonLead} />
        <div className={styles.skeletonLead} />
      </div>
      <div className={styles.secondaryRow}>
        {[0, 1, 2, 3].map((i) => <div key={i} className={styles.skeletonSecondary} />)}
      </div>
    </section>
  )
}

export default function LatestPosts() {
  const { posts, loading, error } = usePosts()
  const [visible, setVisible] = useState(INITIAL)

  if (loading) return <Skeleton />

  if (error || posts.length === 0) {
    return (
      <section className={styles.section}>
        <p className={styles.sectionHeading}>ARTICLES</p>
        <p className={styles.emptyMsg}>{error ? `Could not load posts — ${error}.` : "No posts yet."}</p>
      </section>
    )
  }

  const shown = posts.slice(0, visible)
  const lead = shown.slice(0, 2)         // posts 0–1 in 2-col lead row
  const secondary = shown.slice(2, 6)    // posts 2–5 in 4-col secondary row
  const overflow = shown.slice(6)        // posts 6+ in 4-col grid (load more batches)
  const hasMore = visible < posts.length

  return (
    <section className={styles.section} data-node-id="4:430">
      {/* Section heading */}
      <p className={styles.sectionHeading} data-node-id="4:374">ARTICLES</p>

      {/* Lead row — 2-col */}
      <div className={styles.leadRow} data-node-id="4:375">
        {lead.map((post) => <LeadCard key={post.id} post={post} />)}
      </div>

      {/* Secondary row — 4-col */}
      {secondary.length > 0 && (
        <div className={styles.secondaryRow} data-node-id="4:392">
          {secondary.map((post) => <SecondaryCard key={post.id} post={post} />)}
        </div>
      )}

      {/* Overflow grid — load-more batches */}
      {overflow.length > 0 && (
        <div className={styles.overflowRow}>
          {overflow.map((post) => <SecondaryCard key={post.id} post={post} />)}
        </div>
      )}

      {/* Action row */}
      <div className={styles.moreAction} data-node-id="4:427">
        {hasMore ? (
          <button
            className={styles.viewMoreBtn}
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            data-node-id="4:428"
          >
            VIEW MORE
          </button>
        ) : (
          <a href="/archive" className={`${styles.viewMoreBtn} ${styles.viewMoreLink}`}>
            BROWSE ARCHIVE
          </a>
        )}
      </div>
    </section>
  )
}
