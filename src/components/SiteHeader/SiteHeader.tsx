import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './SiteHeader.module.css';
import SiteNav from '../SiteNav/SiteNav';

const SiteHeader: React.FC = () => {
  // Move state inside the component
  const [isSticky, setIsSticky] = useState(false);

  // Move effect inside the component
  useEffect(() => {
    const handleScroll = () => {
      // Becomes true when user scrolls past 100px
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll); // Cleanup
  }, []);

  return (
    <header className={`${styles.headerContainer} ${isSticky ? styles.scrolled : ''}`}>
        <div className={styles.left}>
          <Link
            className={styles.brand}
            to="/"
            aria-label="365 Evergreen Home"
          >
            <img
              className={styles.brandLogo}
              src="__sitelogo__Evergreen_Logo__50.png"
              alt="365 Evergreen"
            />
            <span className={styles.brandText}>Paulibaby</span>
          </Link>
        </div>

      {/* Fixed a minor typo in your class name from siteaAv to siteNav if applicable */}
      <div className={styles.siteNav}>
        <SiteNav />
      </div>
    </header>
  );
};

export default SiteHeader;

