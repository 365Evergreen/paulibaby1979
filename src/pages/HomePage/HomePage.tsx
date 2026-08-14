import styles from './HomePage.module.css';
import {GetInTouch} from '../../components/GetInTouch/GetInTouch'


export default function HomePage() {
 
  return (
       <div className={styles.contenContainer}>

        Paulibaby
       
               <section className={styles.section}>
          <GetInTouch
            leftColumn={<></>}
            rightColumn={<></>}
          />
        </section></div>
  )};