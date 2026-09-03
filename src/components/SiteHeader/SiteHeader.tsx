import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteNav from '../SiteNav/SiteNav'; // Your existing nav component
import styles from './SiteHeader.module.css';

interface SiteHeaderProps {
  className?: string;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({ className = '' }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Monitor scrolling to handle the background change animation transition effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the drop menu instantly whenever a path changes or layout scales
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

return (
  <header 
    className={`${styles.headerContainer} ${scrolled ? styles.scrolled : ''} ${className}`}
  >
    {/* 1. Logo Left Block Context (Stays on the left margin) */}
    <div className={styles.left}>
      <Link to="/" className={styles.brand} onClick={closeMenu}>
        <img src="/logo.png" alt="Logo" className={styles.brandLogo} />
        <span className={styles.brandText}>Paulibaby</span>
      </Link>
    </div>

    {/* 2. 🍔 Responsive Hamburger Trigger (MOVED HERE TO FIX THE POSITIONING BUG) */}
    <button 
      type="button"
      className={`${styles.hamburgerBtn} ${menuOpen ? styles.isHamburgerActive : ''}`}
      onClick={toggleMenu}
      aria-label="Toggle navigation menu"
    >
      <span className={styles.hamburgerBar}></span>
      <span className={styles.hamburgerBar}></span>
      <span className={styles.hamburgerBar}></span>
    </button>

    {/* 3. Navigation Wrapper Grid Overlay Layer Container */}
    <div className={`${styles.siteNav} ${menuOpen ? styles.isMenuOpen : ''}`}>
      <SiteNav onItemClick={closeMenu} />
    </div>
  </header>
)};
export default SiteHeader