import React from 'react'
import SiteNav from '../SiteNav/SiteNav'
import styles from './SiteHeader.module.css'

const SiteHeader: React.FC = () => {
    return (
    <header>
        <div className={styles.headerContainer}>
            <div className={styles.siteBrand}>  <h2>Paulibaby</h2> </div>
            <div className={styles.siteNavigation}>
                <SiteNav/>
            </div>

        </div>

    </header>);
}

export default SiteHeader