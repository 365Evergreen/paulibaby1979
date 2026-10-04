import { useState, useRef, useEffect, useCallback } from "react"
import styles from "./MusicPlayer.module.css"
import { useMusicContext } from "../../contexts/MusicContext"

/* ── Asset paths ── */
const ICON_SHUFFLE   = "/assets/e220e.svg"   // bold/active shuffle
const ICON_SHUFFLE_  = "/assets/a9fd6.svg"   // linear/inactive shuffle
const ICON_PREV      = "/assets/cfa04.svg"
const ICON_PAUSE     = "/assets/b0d53.svg"
const ICON_NEXT      = "/assets/a28d4.svg"
const ICON_REPEAT    = "/assets/28330.svg"   // repeat-one (bold)
const ICON_REPEAT_   = "/assets/5ff9f.svg"   // repeat (linear)
const ICON_HEART     = "/assets/4faf4.svg"   // linear (unliked)
const ICON_HEART_F   = "/assets/58b88.svg"   // bold (liked)
const ICON_VOLUME    = "/assets/c5e92.svg"
const ICON_QUEUE     = "/assets/cb80e.svg"
const COVER_DEFAULT  = "/assets/b5fe0.png"

/* Inline play triangle matching Vuesax bold style */
function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M5 3.5C5 2.67 5.9 2.17 6.6 2.63L20.6 11.13C21.27 11.57 21.27 12.53 20.6 12.97L6.6 21.47C5.9 21.93 5 21.43 5 20.6V3.5Z"/>
    </svg>
  )
}

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00"
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, "0")}`
}

interface MusicPlayerProps {
  src?: string
  title?: string
  artist?: string
  coverArt?: string
}

type RepeatMode = "off" | "all" | "one"

export default function MusicPlayer({
  src: srcProp,
  title: titleProp,
  artist: artistProp,
  coverArt: coverArtProp,
}: MusicPlayerProps) {
  const ctx = useMusicContext()

  // Context track takes precedence over props
  const src      = ctx.currentTrack?.src      ?? srcProp
  const title    = ctx.currentTrack?.title    ?? titleProp    ?? "Jiwa yang Bersedih"
  const artist   = ctx.currentTrack?.artist   ?? artistProp   ?? "Ghea Indrawati"
  const coverArt = ctx.currentTrack?.cover    ?? coverArtProp ?? COVER_DEFAULT

  const audioRef       = useRef<HTMLAudioElement>(null)
  const progressRef    = useRef<HTMLDivElement>(null)
  const volumeRef      = useRef<HTMLDivElement>(null)

  const [playing,      setPlaying]     = useState(false)
  const [currentTime,  setCurrentTime] = useState(0)
  const [duration,     setDuration]    = useState(0)
  const [volume,       setVolume]      = useState(0.7)
  const [shuffle,      setShuffle]     = useState(false)
  const [repeat,       setRepeat]      = useState<RepeatMode>("off")
  const [liked,        setLiked]       = useState(false)
  const [seekDragging, setSeekDragging]= useState(false)
  const [volDragging,  setVolDragging] = useState(false)

  /* ── Auto-play when context track changes ── */
  useEffect(() => {
    const a = audioRef.current
    if (!a || !ctx.currentTrack) return
    // src attribute is already updated via the <audio> element; let it reload then play
    a.load()
    a.play().catch(() => {})
  }, [ctx.currentTrack])

  /* ── Audio events ── */
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onTime  = () => setCurrentTime(a.currentTime)
    const onMeta  = () => setDuration(a.duration)
    const onPlay  = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnd   = () => {
      if (repeat === "one") { a.currentTime = 0; a.play() }
      else setPlaying(false)
    }
    a.volume = volume
    a.addEventListener("timeupdate",     onTime)
    a.addEventListener("loadedmetadata", onMeta)
    a.addEventListener("play",           onPlay)
    a.addEventListener("pause",          onPause)
    a.addEventListener("ended",          onEnd)
    return () => {
      a.removeEventListener("timeupdate",     onTime)
      a.removeEventListener("loadedmetadata", onMeta)
      a.removeEventListener("play",           onPlay)
      a.removeEventListener("pause",          onPause)
      a.removeEventListener("ended",          onEnd)
    }
  }, [repeat, volume])

  /* ── Play / pause ── */
  const togglePlay = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) a.play().catch(() => {})
    else          a.pause()
  }, [])

  /* ── Progress seek ── */
  const seekTo = useCallback((clientX: number) => {
    const a = audioRef.current
    const bar = progressRef.current
    if (!a || !bar || !isFinite(a.duration)) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    a.currentTime = pct * a.duration
  }, [])

  const handleProgressDown = useCallback((e: React.MouseEvent) => {
    setSeekDragging(true)
    seekTo(e.clientX)
    e.preventDefault()
  }, [seekTo])

  /* ── Volume ── */
  const setVolumeAt = useCallback((clientX: number) => {
    const bar = volumeRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    setVolume(pct)
    if (audioRef.current) audioRef.current.volume = pct
  }, [])

  const handleVolumeDown = useCallback((e: React.MouseEvent) => {
    setVolDragging(true)
    setVolumeAt(e.clientX)
    e.preventDefault()
  }, [setVolumeAt])

  /* ── Global drag events ── */
  useEffect(() => {
    if (!seekDragging && !volDragging) return
    const onMove = (e: MouseEvent) => {
      if (seekDragging) seekTo(e.clientX)
      if (volDragging)  setVolumeAt(e.clientX)
    }
    const onUp = () => { setSeekDragging(false); setVolDragging(false) }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup",   onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup",   onUp)
    }
  }, [seekDragging, volDragging, seekTo, setVolumeAt])

  /* ── Repeat cycle ── */
  const cycleRepeat = () =>
    setRepeat((r) => r === "off" ? "all" : r === "all" ? "one" : "off")

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      <audio ref={audioRef} src={src} preload="metadata" loop={repeat === "one"} />

      <div className={styles.bar} data-node-id="302:3566" role="region" aria-label="Music player">

        {/* ── Left: album art + track info ── */}
        <div className={styles.trackInfo} data-node-id="302:3567">
          <div className={styles.coverWrap} data-node-id="302:3568">
            <img src={coverArt} alt={title} className={styles.cover} />
          </div>
          <div className={styles.trackText} data-node-id="302:3569">
            <p className={styles.trackTitle} data-node-id="302:3570">{title}</p>
            <p className={styles.trackArtist} data-node-id="302:3571">{artist}</p>
          </div>
        </div>

        {/* ── Centre: controls + progress ── */}
        <div className={styles.centre} data-node-id="302:3572">
          {/* Transport controls */}
          <div className={styles.controls} data-node-id="302:3573">
            <button
              className={`${styles.iconBtn} ${shuffle ? styles.active : ""}`}
              onClick={() => setShuffle((s) => !s)}
              aria-label="Shuffle"
              data-node-id="302:3574"
            >
              <img src={shuffle ? ICON_SHUFFLE : ICON_SHUFFLE_} alt="" className={styles.iconSm} />
            </button>

            <button className={styles.iconBtn} aria-label="Previous" data-node-id="302:3576">
              <img src={ICON_PREV} alt="" className={styles.iconSm} />
            </button>

            <button
              className={styles.playBtn}
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
              data-node-id="302:3577"
            >
              {playing
                ? <img src={ICON_PAUSE} alt="" className={styles.playIcon} />
                : <PlayIcon />
              }
            </button>

            <button className={styles.iconBtn} aria-label="Next" data-node-id="302:3579">
              <img src={ICON_NEXT} alt="" className={styles.iconSm} />
            </button>

            <button
              className={`${styles.iconBtn} ${repeat !== "off" ? styles.active : ""}`}
              onClick={cycleRepeat}
              aria-label={`Repeat: ${repeat}`}
              title={repeat === "one" ? "Repeat one" : repeat === "all" ? "Repeat all" : "No repeat"}
              data-node-id="302:3580"
            >
              <img
                src={repeat === "one" ? ICON_REPEAT : ICON_REPEAT_}
                alt=""
                className={styles.iconSm}
              />
            </button>
          </div>

          {/* Progress row */}
          <div className={styles.progressRow} data-node-id="302:3582">
            <span className={styles.timeLabel} data-node-id="302:3583">{formatTime(currentTime)}</span>

            <div
              ref={progressRef}
              className={styles.progressWrap}
              onMouseDown={handleProgressDown}
              onClick={(e) => seekTo(e.clientX)}
              role="slider"
              aria-label="Seek"
              aria-valuenow={Math.round(currentTime)}
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              data-node-id="302:3584"
            >
              <div className={styles.progressTrack} data-node-id="302:3585" />
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
                data-node-id="302:3586"
              />
              <div className={styles.progressThumb} style={{ left: `${progress}%` }} aria-hidden />
            </div>

            <span className={styles.timeLabel} data-node-id="302:3587">{formatTime(duration)}</span>
          </div>
        </div>

        {/* ── Right: like, volume, queue ── */}
        <div className={styles.aside} data-node-id="302:3588">
          <button
            className={`${styles.iconBtn} ${liked ? styles.liked : ""}`}
            onClick={() => setLiked((l) => !l)}
            aria-label={liked ? "Unlike" : "Like"}
            data-node-id="302:3589"
          >
            <img src={liked ? ICON_HEART_F : ICON_HEART} alt="" className={styles.iconSm} />
          </button>

          <button className={styles.iconBtn} aria-label="Volume" data-node-id="302:3590">
            <img src={ICON_VOLUME} alt="" className={styles.iconSm} />
          </button>

          <div
            ref={volumeRef}
            className={styles.volumeWrap}
            onMouseDown={handleVolumeDown}
            onClick={(e) => setVolumeAt(e.clientX)}
            role="slider"
            aria-label="Volume"
            aria-valuenow={Math.round(volume * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            data-node-id="302:3591"
          >
            <div className={styles.volumeTrack} data-node-id="302:3592" />
            <div
              className={styles.volumeFill}
              style={{ width: `${volume * 100}%` }}
              data-node-id="302:3593"
            />
            <div className={styles.volumeThumb} style={{ left: `${volume * 100}%` }} aria-hidden />
          </div>

          <button className={styles.iconBtn} aria-label="Queue" data-node-id="302:3594">
            <img src={ICON_QUEUE} alt="" className={styles.iconSm} />
          </button>
        </div>

      </div>
    </>
  )
}
