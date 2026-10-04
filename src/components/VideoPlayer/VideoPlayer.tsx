import { useState, useEffect, useRef, useCallback } from "react"
import styles from "./VideoPlayer.module.css"

/* ── Asset paths (all from Figma design archive) ── */
const ICON_PLAY       = "/assets/85650.svg"
const ICON_PAUSE      = "/assets/08b73.svg"
const ICON_SKIP_BACK  = "/assets/ea613.svg"
const ICON_SKIP_FWD   = "/assets/4584b.svg"
const ICON_VOLUME     = "/assets/10be8.svg"
const ICON_SUBTITLES  = "/assets/3d20d.svg"
const ICON_FULLSCREEN = "/assets/b6d4b.svg"
const ICON_MORE       = "/assets/4d0bb.svg"
const POSTER_DEFAULT  = "/assets/4ee3c.png"

function formatTime(s: number): string {
  if (!isFinite(s)) return "0:00"
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0")
  const ss = String(sec).padStart(2, "0")
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

interface VideoPlayerProps {
  src?: string
  poster?: string
  title?: string
  className?: string
}

export default function VideoPlayer({
  src,
  poster = POSTER_DEFAULT,
  title = "Cold Little Heart",
  className,
}: VideoPlayerProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const videoRef      = useRef<HTMLVideoElement>(null)
  const progressRef   = useRef<HTMLDivElement>(null)
  const hideTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [playing,      setPlaying]      = useState(false)
  const [currentTime,  setCurrentTime]  = useState(0)
  const [duration,     setDuration]     = useState(0)
  const [muted,        setMuted]        = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [seeking,      setSeeking]      = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  /* ── Auto-hide controls ── */
  const startHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  const revealControls = useCallback(() => {
    setShowControls(true)
    startHideTimer()
  }, [startHideTimer])

  /* ── Play / pause ── */
  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else          { v.pause(); setPlaying(false) }
    revealControls()
  }, [revealControls])

  /* ── Skip ── */
  const skip = useCallback((delta: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + delta))
    revealControls()
  }, [revealControls])

  /* ── Progress bar seek ── */
  const seekTo = useCallback((clientX: number) => {
    const v = videoRef.current
    const bar = progressRef.current
    if (!v || !bar || !isFinite(v.duration)) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    v.currentTime = pct * v.duration
  }, [])

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    seekTo(e.clientX)
    revealControls()
  }, [seekTo, revealControls])

  const handleProgressMouseDown = useCallback((e: React.MouseEvent) => {
    setSeeking(true)
    seekTo(e.clientX)
    e.preventDefault()
  }, [seekTo])

  /* ── Global mouse move/up during seek drag ── */
  useEffect(() => {
    if (!seeking) return
    const onMove = (e: MouseEvent) => seekTo(e.clientX)
    const onUp   = () => setSeeking(false)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [seeking, seekTo])

  /* ── Mute ── */
  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
    revealControls()
  }, [revealControls])

  /* ── Fullscreen ── */
  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.()
    } else {
      await document.exitFullscreen?.()
    }
    revealControls()
  }, [revealControls])

  /* ── Video event listeners ── */
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime     = () => setCurrentTime(v.currentTime)
    const onMeta     = () => setDuration(v.duration)
    const onPlay     = () => setPlaying(true)
    const onPause    = () => setPlaying(false)
    const onFull     = () => setIsFullscreen(!!document.fullscreenElement)
    v.addEventListener("timeupdate",        onTime)
    v.addEventListener("loadedmetadata",    onMeta)
    v.addEventListener("play",              onPlay)
    v.addEventListener("pause",             onPause)
    document.addEventListener("fullscreenchange", onFull)
    return () => {
      v.removeEventListener("timeupdate",      onTime)
      v.removeEventListener("loadedmetadata",  onMeta)
      v.removeEventListener("play",            onPlay)
      v.removeEventListener("pause",           onPause)
      document.removeEventListener("fullscreenchange", onFull)
    }
  }, [])

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) &&
          document.activeElement !== document.body) return
      if (e.target instanceof HTMLInputElement) return
      if (e.code === "Space")      { e.preventDefault(); togglePlay() }
      if (e.code === "ArrowLeft")  { e.preventDefault(); skip(-10) }
      if (e.code === "ArrowRight") { e.preventDefault(); skip(10) }
      if (e.code === "KeyM")       { toggleMute() }
      if (e.code === "KeyF")       { toggleFullscreen() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [togglePlay, skip, toggleMute, toggleFullscreen])

  /* ── Show controls on mount, start timer ── */
  useEffect(() => { startHideTimer() }, [startHideTimer])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className={`${styles.player} ${className ?? ""} ${isFullscreen ? styles.fullscreenMode : ""}`}
      data-node-id="27:130"
      onMouseMove={revealControls}
      onMouseLeave={() => playing && setShowControls(false)}
      tabIndex={0}
      aria-label="Video player"
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={styles.video}
        onClick={togglePlay}
        playsInline
        preload="metadata"
      />

      {/* Dark overlay */}
      <div className={styles.overlay} aria-hidden onClick={togglePlay} />

      {/* Big centre play button (visible when paused and controls shown) */}
      {!playing && showControls && (
        <button
          className={styles.centrePlay}
          onClick={togglePlay}
          aria-label="Play"
        >
          <img src={ICON_PLAY} alt="" width={48} height={48} className={styles.centrePlayIcon} />
        </button>
      )}

      {/* Controls bar */}
      <div
        className={`${styles.controls} ${showControls ? styles.controlsVisible : styles.controlsHidden}`}
        data-node-id="53:299"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Info row */}
        <div className={styles.info} data-node-id="I53:299;27:133">
          <p className={styles.title}>{title}</p>
          <p className={styles.timeDisplay}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>

        {/* Progress bar */}
        <div
          ref={progressRef}
          className={styles.progressBar}
          data-node-id="I53:299;27:142"
          onClick={handleProgressClick}
          onMouseDown={handleProgressMouseDown}
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.round(currentTime)}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
        >
          <div className={styles.progressTrack} data-node-id="I53:299;27:143" />
          <div
            className={styles.progressFill}
            data-node-id="I53:299;27:144"
            style={{ width: `${progress}%` }}
          />
          <div
            className={styles.progressThumb}
            style={{ left: `${progress}%` }}
            aria-hidden
          />
        </div>

        {/* Controls row */}
        <div className={styles.controlsRow} data-node-id="I53:299;36:139">
          {/* Left: play, skip back, skip forward */}
          <div className={styles.leftControls} data-node-id="I53:299;34:104">
            <button
              className={styles.iconBtn}
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
              data-node-id="I53:299;34:96"
            >
              <img
                src={playing ? ICON_PAUSE : ICON_PLAY}
                alt=""
                className={styles.icon}
                data-node-id="I53:299;34:96;28:160"
              />
            </button>
            <button
              className={styles.iconBtn}
              onClick={() => skip(-10)}
              aria-label="Skip back 10 seconds"
              data-node-id="I53:299;34:100"
            >
              <img src={ICON_SKIP_BACK} alt="" className={styles.icon} data-node-id="I53:299;34:100;46:312" />
            </button>
            <button
              className={styles.iconBtn}
              onClick={() => skip(10)}
              aria-label="Skip forward 10 seconds"
              data-node-id="I53:299;34:105"
            >
              <img src={ICON_SKIP_FWD} alt="" className={styles.icon} data-node-id="I53:299;34:105;46:309" />
            </button>
          </div>

          {/* Right: volume, subtitles, fullscreen, more */}
          <div className={styles.rightControls} data-node-id="I53:299;34:115">
            <button
              className={`${styles.iconBtn} ${muted ? styles.iconBtnMuted : ""}`}
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              data-node-id="I53:299;34:116"
            >
              <img src={ICON_VOLUME} alt="" className={styles.icon} data-node-id="I53:299;34:116;51:193" />
            </button>
            <button
              className={styles.iconBtn}
              aria-label="Subtitles"
              data-node-id="node-28_139"
            >
              <img src={ICON_SUBTITLES} alt="" className={styles.iconSm} data-node-id="node-46_218" />
            </button>
            <button
              className={styles.iconBtn}
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              data-node-id="node-28_135"
            >
              <img src={ICON_FULLSCREEN} alt="" className={styles.icon} data-node-id="node-46_196" />
            </button>
            <button
              className={styles.iconBtn}
              aria-label="More options"
              data-node-id="node-28_143"
            >
              <img src={ICON_MORE} alt="" className={styles.iconXs} data-node-id="node-28_145" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
