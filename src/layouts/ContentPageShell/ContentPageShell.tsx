
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import SiteHeader from '../../components/SiteHeader/SiteHeader';
import styles from './ContentPageShell.module.css';
import { Outlet } from 'react-router-dom';

export function ContentPageShell() {
    return (

        <div className={styles.contentPageShell}>

            <main className={styles.mainContent}> 
                <SiteHeader />
                <Outlet />
            </main>
            <SiteFooter />
        </div>
    )
};


export default ContentPageShell