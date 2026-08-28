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
