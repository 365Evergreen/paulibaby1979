import styles from './HomePage.module.css';
import {GetInTouch} from '../../components/GetInTouch/GetInTouch'
import LatestPosts from '../../components/LatestPosts/LatestPosts';


export default function HomePage() {
 
  return (
       <div className={styles.contenContainer}>

        Paulibaby
       
               <section className={styles.section}>

                <LatestPosts/>
          <GetInTouch
            leftColumn={<></>}
            rightColumn={<></>}
          />
        </section></div>
  )};

