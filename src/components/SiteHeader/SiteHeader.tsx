<<<<<<< HEAD
import React from 'react';
import styles from './SiteHeader.module.css'
import SiteNav from '../SiteNavigation/SiteNav';


const SiteHeader: React.FC = () => {
    return (
        <header className={styles.headerContainer}>
        <div className={styles.siteBrand}>  <h1>Paul Murphy</h1>
        <br/>
        <p>Microsoft 365 and Power Platform specialist</p>

            </div>
        <div className={styles.siteNav}>    
            <SiteNav />
            </div>
        </header>
    );
}

export default SiteHeader;
=======
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
>>>>>>> 59aabae71b4359f0bf4cefe3869c50fefbbb9dab
