
//import SiteFooter from '../../components/SiteFooter/SiteFooter';
import SiteHeader from '../components/SiteHeader/SiteHeader';
import styles from './AppShell.module.css';
import { Outlet } from 'react-router-dom';
import MusicPlayer from '../components/MusicPlayer/MusicPlayer'
import { MusicProvider } from '../contexts/MusicContext'

 const AppShell = () => {
  return (
    <MusicProvider>
      <div className={styles.appShell}>
        <SiteHeader/>
           <main className={styles.mainContent} style={{ paddingBottom: "110px" }}>
               <div className={styles.contentContainer}>
         <Outlet />
          </div>
        </main>
      
        <MusicPlayer />
      </div>
    </MusicProvider>
  );
};

export default AppShell