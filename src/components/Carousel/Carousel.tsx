import { useState, useEffect, useCallback } from "react"
import { usePosts, formatDate, type Post } from "../../hooks/usePosts"
import styles from "./Carousel.module.css"

function TypeKicker({ type }: { type: Post["type"] }) {
  const labels: Record<Post["type"], string> = {
    article: "Article",
    audio: "Audio",
    video: "Video",
  }
  return (
    <span className={`${styles.kicker} ${styles[`kicker--${type}`]}`}>
      {labels[type]}
    </span>
  )
}

function ProgressBar({
  duration,
  paused,
}: {
  duration: number
  active: boolean
  paused: boolean
}) {
  return (
    <div className={styles.progressTrack}>
      <div
        className={styles.progressFill}
        style={{
          animationDuration: `${duration}ms`,
          animationPlayState: paused ? "paused" : "running",
        }}
      />
    </div>
  )
}

export default function Carousel() {
  const { posts, loading } = usePosts()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const INTERVAL = 6000

  const slides = posts.filter((p) => p.cover_image).slice(0, 5)

  const total = slides.length

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % total)
    setImageLoaded(false)
  }, [total])

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total)
    setImageLoaded(false)
  }, [total])

  useEffect(() => {
    if (total <= 1 || paused) return
    const t = setInterval(next, INTERVAL)
    return () => clearInterval(t)
  }, [next, paused, total])

  if (loading || total === 0) {
    return <div className={styles.skeleton} aria-hidden />
  }

  const slide = slides[index]
  const pad = (n: number) => String(n + 1).padStart(2, "0")

  return (
    <section
      className={styles.hero}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Featured posts"
    >
      {/* Text panel */}
      <div className={styles.panel}>
        <div className={styles.panelInner}>
          <div className={styles.meta}>
            <TypeKicker type={slide.type} />
            <time className={styles.date}>{formatDate(slide.created_at)}</time>
          </div>

          <h2 className={styles.headline}>
            <a href={`/blog/${slide.slug}`} className={styles.headlineLink}>
              {slide.title}
            </a>
          </h2>

          {slide.excerpt && <p className={styles.excerpt}>{slide.excerpt}</p>}

          <a href={`/blog/${slide.slug}`} className={styles.cta}>
            {slide.type === "audio"
              ? "Listen"
              : slide.type === "video"
                ? "Watch"
                : "Read"}{" "}
            →
          </a>
        </div>

        {/* Footer: counter + nav */}
        <div className={styles.footer}>
          <span className={styles.counter}>
            <strong>{pad(index)}</strong>
            <span className={styles.counterSep}>/</span>
            {pad(total - 1)}
          </span>

          {total > 1 && (
            <div className={styles.navButtons}>
              <button
                className={styles.navBtn}
                onClick={prev}
                aria-label="Previous slide"
              >
                ←
              </button>
              <button
                className={styles.navBtn}
                onClick={next}
                aria-label="Next slide"
              >
                →
              </button>
            </div>
          )}

          {total > 1 && (
            <div className={styles.dots}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${
                    i === index ? styles.dotActive : ""
                  }`}
                  onClick={() => {
                    setIndex(i)
                    setImageLoaded(false)
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image panel */}
      <div className={styles.imageSide} aria-hidden>
        {slides.map((s, i) => (
          <div
            key={s.slug}
            className={`${styles.imageSlot} ${
              i === index ? styles.imageSlotActive : ""
            }`}
          >
            <img
              src={s.cover_image!}
              alt={s.title}
              className={styles.image}
              loading={i === 0 ? "eager" : "lazy"}
              onLoad={() => i === index && setImageLoaded(true)}
            />
          </div>
        ))}
        <div
          className={styles.imageTint}
          style={{ opacity: imageLoaded ? 0 : 1 }}
        />
      </div>

      {/* Bottom progress bar */}
      {total > 1 && (
        <ProgressBar
          duration={INTERVAL}
          active
          paused={paused}
          key={`${index}-${paused}`}
        />
      )}
    </section>
  )
}
