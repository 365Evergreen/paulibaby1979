import styles from "./PlayerSidebar.module.css"

const ICON_HOME      = "/assets/ed135.svg"
const ICON_ARTIST    = "/assets/d8747.svg"
const ICON_ALBUM     = "/assets/65f19.svg"
const ICON_PODCAST   = "/assets/d8747.svg"
const ICON_AUDIOBOOK = "/assets/13d0d.svg"
const ICON_RECENT    = "/assets/d081c.svg"
const ICON_HEART     = "/assets/e5880.svg"
const ICON_PLAYLIST  = "/assets/79188.svg"
const ICON_SETTING   = "/assets/17c15.svg"
const ICON_ACCOUNT   = "/assets/e6fdb.svg"
const ICON_LOGOUT    = "/assets/17651.svg"
const ICON_LOGO_V    = "/assets/d6a6e.svg"

interface NavItemProps {
  icon: string
  label: string
  active?: boolean
}

function NavItem({ icon, label, active }: NavItemProps) {
  return (
    <div className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}>
      <img src={icon} alt="" className={styles.navIcon} />
      <span className={styles.navLabel}>{label}</span>
    </div>
  )
}

export default function PlayerSidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src={ICON_LOGO_V} alt="" className={styles.logoMark} />
        <span className={styles.logoText}>
          <span className={styles.logoSemi}>Musi</span><span className={styles.logoReg}>verse</span>
        </span>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>
          <p className={styles.sectionLabel}>Discover</p>
          <NavItem icon={ICON_HOME}      label="Home"       active />
          <NavItem icon={ICON_ARTIST}    label="Artist" />
          <NavItem icon={ICON_ALBUM}     label="Album" />
          <NavItem icon={ICON_PODCAST}   label="Podcast" />
          <NavItem icon={ICON_AUDIOBOOK} label="Audio Book" />
        </div>

        <div className={styles.navSection}>
          <p className={styles.sectionLabel}>Library</p>
          <NavItem icon={ICON_RECENT}   label="Recent" />
          <NavItem icon={ICON_HEART}    label="Favourites" />
          <NavItem icon={ICON_PLAYLIST} label="Playlist" />
        </div>

        <div className={styles.navSection}>
          <p className={styles.sectionLabel}>More</p>
          <NavItem icon={ICON_SETTING} label="Setting" />
          <NavItem icon={ICON_ACCOUNT} label="Account" />
          <NavItem icon={ICON_LOGOUT}  label="Logout" />
        </div>
      </nav>
    </aside>
  )
}
