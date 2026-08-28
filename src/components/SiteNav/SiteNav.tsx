import React from "react";
import { Link } from "react-router-dom";
import styles from './SiteNav.module.css'
const SiteNav: React.FC = () => {
 return (
   <nav className={styles.navContainer}>
     <ul className={styles.navLinks}>
       <li><Link to="/">Home</Link></li>
       <li><Link to="/admin">Editor</Link></li>
       <li><Link to="/contact">Contact</Link></li>
     </ul>
   </nav>
 );
};

 
export default SiteNav;