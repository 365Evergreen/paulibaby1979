import React from "react";
import { NavLink } from "react-router-dom"; // Make sure this is NavLink, not Link
import styles from './SiteNav.module.css';

const SiteNav: React.FC = () => {
 return (
   <nav className={styles.navContainer}>
     <ul className={styles.navLinks}>
       <li><NavLink to="/">Home</NavLink></li>
       <li><NavLink to="/media-library">Media library</NavLink></li>
       <li><NavLink to="/admin">Editor</NavLink></li>
       <li><NavLink to="/contact">Contact</NavLink></li>
     </ul>
   </nav>
 );
};

export default SiteNav;
