import { createContext, useContext, useState, type ReactNode } from "react"
import type { Track } from "../hooks/useMusic"

interface MusicContextValue {
  currentTrack: Track | null
  isPlaying: boolean
  playTrack: (track: Track) => void
  pause: () => void
  resume: () => void
}

const MusicContext = createContext<MusicContextValue>({
  currentTrack: null,
  isPlaying: false,
  playTrack: () => {},
  pause: () => {},
  resume: () => {},
})

export function MusicProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  function playTrack(track: Track) {
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  function pause() {
    setIsPlaying(false)
  }

  function resume() {
    setIsPlaying(true)
  }

  return (
    <MusicContext.Provider value={{ currentTrack, isPlaying, playTrack, pause, resume }}>
      {children}
    </MusicContext.Provider>
  )
}

export function useMusicContext() {
  return useContext(MusicContext)
}
