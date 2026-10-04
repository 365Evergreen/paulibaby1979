import type { Album, Track } from "../../hooks/useMusic"
import styles from "./TopChartSection.module.css"

const ICON_PLAYING = "/assets/475a2.svg"

interface Props {
  albums: Album[]
  currentTrack: Track | null
  onPlay: (track: Track) => void
}

function TrackRow({
  rank,
  track,
  active,
  onPlay,
}: {
  rank: number
  track: Track
  active: boolean
  onPlay: () => void
}) {
  return (
    <div
      className={`${styles.trackRow} ${active ? styles.trackRowActive : ""}`}
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onPlay()}
    >
      <div className={styles.rankCell}>
        {active
          ? <img src={ICON_PLAYING} alt="Playing" className={styles.rankPlay} />
          : <span className={styles.rankNum}>{rank}</span>
        }
      </div>
      <div className={styles.trackInfo}>
        <p className={styles.trackTitle}>{track.title}</p>
        <p className={styles.trackSub}>{track.artist}</p>
      </div>
    </div>
  )
}

export default function TopChartSection({ albums, currentTrack, onPlay }: Props) {
  const allTracks = albums.flatMap((a) => a.tracks)
  const half = Math.ceil(allTracks.length / 2)
  const leftTracks  = allTracks.slice(0, half)
  const rightTracks = allTracks.slice(half)

  const coverLeft  = albums[0]?.cover ?? ""
  const coverRight = albums[0]?.cover ?? ""
  const labelLeft  = albums[0]?.album ?? "Tracks"
  const labelRight = albums[0]?.artist ?? ""

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Track Listing</h2>
      </div>
      <div className={styles.panels}>
        <ChartPanel
          coverSrc={coverLeft}
          label={labelLeft}
          tracks={leftTracks}
          currentTrack={currentTrack}
          onPlay={onPlay}
          startRank={1}
        />
        {rightTracks.length > 0 && (
          <ChartPanel
            coverSrc={coverRight}
            label={labelRight}
            tracks={rightTracks}
            currentTrack={currentTrack}
            onPlay={onPlay}
            startRank={half + 1}
          />
        )}
      </div>
    </section>
  )
}

function ChartPanel({
  coverSrc,
  label,
  tracks,
  currentTrack,
  onPlay,
  startRank,
}: {
  coverSrc: string
  label: string
  tracks: Track[]
  currentTrack: Track | null
  onPlay: (t: Track) => void
  startRank: number
}) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelCover}>
        <img src={coverSrc} alt={label} className={styles.panelImg} />
        <div className={styles.panelOverlay} />
        <p className={styles.panelLabel}>{label}</p>
      </div>
      <div className={styles.panelTracks}>
        {tracks.map((t, i) => (
          <TrackRow
            key={t.src}
            rank={startRank + i}
            track={t}
            active={currentTrack?.src === t.src}
            onPlay={() => onPlay(t)}
          />
        ))}
      </div>
    </div>
  )
}
