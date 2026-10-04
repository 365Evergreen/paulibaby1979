import type { Album, Track } from "../../hooks/useMusic"
import styles from "./RecommendedGrid.module.css"

const ICON_PLAY = "/assets/21524.svg"

interface Props {
  album: Album
  currentTrack: Track | null
  onPlay: (track: Track) => void
}

function TrackCard({
  track,
  active,
  onPlay,
}: {
  track: Track
  active: boolean
  onPlay: () => void
}) {
  return (
    <div
      className={`${styles.card} ${active ? styles.cardActive : ""}`}
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onPlay()}
      aria-label={`Play ${track.title}`}
    >
      <div className={styles.coverWrap}>
        <img src={track.cover} alt={track.album} className={styles.cover} />
        <div className={styles.playOverlay} aria-hidden>
          <img src={ICON_PLAY} alt="" className={styles.playIcon} />
        </div>
        {active && <div className={styles.activeRing} aria-hidden />}
      </div>
      <div className={styles.info}>
        <p className={styles.title}>{track.title}</p>
        <p className={styles.artist}>{track.artist}</p>
      </div>
    </div>
  )
}

export default function RecommendedGrid({
  album,
  currentTrack,
  onPlay,
}: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>{album.album}</h2>
          <p className={styles.subheading}>{album.artist}</p>
        </div>
      </div>
      <div className={styles.grid}>
        {album.tracks.map((track) => (
          <TrackCard
            key={track.trackNum}
            track={track}
            active={currentTrack?.src === track.src}
            onPlay={() => onPlay(track)}
          />
        ))}
      </div>
    </section>
  )
}
