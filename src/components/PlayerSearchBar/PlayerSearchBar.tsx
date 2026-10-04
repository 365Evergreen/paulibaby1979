import styles from "./PlayerSearchBar.module.css"

const ICON_SEARCH = "/assets/d9151.svg"

export default function PlayerSearchBar() {
  return (
    <div className={styles.bar}>
      <div className={styles.searchWrap}>
        <img src={ICON_SEARCH} alt="" className={styles.searchIcon} />
        <input
          type="search"
          placeholder="Search artist, title, album"
          className={styles.searchInput}
          aria-label="Search"
        />
      </div>
      <div className={styles.actions}>
   
      </div>
    </div>
  )
}
