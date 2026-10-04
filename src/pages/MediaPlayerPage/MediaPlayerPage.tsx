import { useMusic } from "../../hooks/useMusic"
import { useMusicContext } from "../../contexts/MusicContext"
import PlayerSidebar from "../../components/PlayerSidebar/PlayerSidebar"
import PlayerSearchBar from "../../components/PlayerSearchBar/PlayerSearchBar"
import RecommendedGrid from "../../components/RecommendedGrid/RecommendedGrid"
import TopChartSection from "../../components/TopChartSection/TopChartSection"
import styles from "./MediaPlayerPage.module.css"

export default function MediaPlayerPage() {
  const { albums, loading } = useMusic()
  const { playTrack, currentTrack } = useMusicContext()

  return (
    <div className={styles.page}>
      <PlayerSidebar />

      <div className={styles.content}>
        <PlayerSearchBar />

        {loading && <p className={styles.loading}>Loading…</p>}

        {albums.map((album) => (
          <RecommendedGrid
            key={album.album}
            album={album}
            currentTrack={currentTrack}
            onPlay={playTrack}
          />
        ))}

        {albums.length > 0 && (
          <TopChartSection
            albums={albums}
            currentTrack={currentTrack}
            onPlay={playTrack}
          />
        )}
      </div>
    </div>
  )
}
