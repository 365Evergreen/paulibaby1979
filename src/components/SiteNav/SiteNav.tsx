import React from "react";
import { Link } from "react-router-dom";
import styles from './SiteNav.module.css'
import siteNav from './siteNav.json'
const SiteNav: React.FC = () => {
 return (
   <nav className={styles.navContainer}>
     <ul className={styles.navLinks}>
           <li><Link to="/">Home</Link></li>
       <li><Link to="/what-we-do">What we do</Link></li>
       <li><Link to="/blog">Blog posts</Link></li>
     </ul>
   </nav>
 );
};
 
export default SiteNav;