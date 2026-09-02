import  { useState } from 'react';
import menuData from './siteNav.json';
import styles from './SiteNav.module.css';

export default function SiteNav() {
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);

  return (
    <nav className={styles.navBar} aria-label="Main Navigation">
      <ul className={styles.navLinks}>
        {menuData.map((item) => (
          <li 
            key={item.id} 
            className={styles.navItem}
            onMouseEnter={() => setActiveMenuId(item.id)}
            onMouseLeave={() => setActiveMenuId(null)}
          >
        <a href={item.href} className={styles.navLink}>
          {item.title}
          {item.hasMegaMenu && <span className={styles.arrow}>▼</span>}
        </a>
            {/* Conditionally render Mega Menu dropdown if data exists and active */}
            {item.hasMegaMenu && activeMenuId === item.id && (
              <div className={styles.megamenuDropdown}>
                <div className={styles.megamenuGrid}>
                  {item.columns?.map((column, colIdx) => (
                    <div key={colIdx} className="megamenu-column">
                      <h4 className="column-heading">{column.heading}</h4>
                      <ul className="column-links">
                        {column.links.map((link, linkIdx) => (
                          <li key={linkIdx}>
                            <a href={link.href} className="sub-link">
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
