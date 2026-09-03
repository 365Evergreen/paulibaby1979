
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import SiteHeader from '../../components/SiteHeader/SiteHeader';
import styles from './AppShell.module.css';
import { Outlet } from 'react-router-dom';

export function AppShell() {
    return (

        <div className={styles.shellContainer}>
            <SiteHeader />
            <main className={styles.mainContent}>
                <Outlet />
            </main>
            <SiteFooter />
        </div>
    )
};


export default AppShell;